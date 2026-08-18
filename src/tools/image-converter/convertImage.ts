import { buildOutputFilename, getExtension } from '@/lib/file'

export type ImageFormatId = 'jpeg' | 'png' | 'webp'
export type SupportedImageMime = 'image/jpeg' | 'image/png' | 'image/webp'

export interface ImageFormatCapability {
  id: ImageFormatId
  label: string
  mimeType: SupportedImageMime
  extension: 'jpg' | 'png' | 'webp'
  inputExtensions: readonly string[]
  supportsTransparency: boolean
  encoderQuality?: number
}

/** The source of truth for every input and output the converter claims to support. */
export const IMAGE_FORMATS: readonly ImageFormatCapability[] = [
  {
    id: 'jpeg',
    label: 'JPG',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    inputExtensions: ['jpg', 'jpeg'],
    supportsTransparency: false,
    encoderQuality: 0.92,
  },
  {
    id: 'png',
    label: 'PNG',
    mimeType: 'image/png',
    extension: 'png',
    inputExtensions: ['png'],
    supportsTransparency: true,
  },
  {
    id: 'webp',
    label: 'WebP',
    mimeType: 'image/webp',
    extension: 'webp',
    inputExtensions: ['webp'],
    supportsTransparency: true,
    encoderQuality: 0.92,
  },
] as const

export const ACCEPTED_MIME_TYPES = IMAGE_FORMATS.map((format) => format.mimeType)
export const ACCEPTED_EXTENSIONS = IMAGE_FORMATS.flatMap((format) => format.inputExtensions)
export const ACCEPTED_LABEL = IMAGE_FORMATS.map((format) => format.label).join(', ')
export const MAX_BYTES = 25 * 1024 * 1024
export const MAX_PIXELS = 16_777_216

export interface CanvasRenderingContext2DLike {
  fillStyle: string
  imageSmoothingEnabled: boolean
  imageSmoothingQuality: 'low' | 'medium' | 'high'
  fillRect(x: number, y: number, width: number, height: number): void
  drawImage(source: CanvasImageSource, dx: number, dy: number, width: number, height: number): void
}

export interface CanvasLike {
  width: number
  height: number
  getContext(contextId: '2d'): CanvasRenderingContext2DLike | null
  toBlob(
    callback: (blob: Blob | null) => void,
    type?: string,
    quality?: number,
  ): void
}

export interface DecodedImage {
  source: CanvasImageSource
  width: number
  height: number
  release(): void
}

export interface ConvertImageDeps {
  decode(file: File): Promise<DecodedImage>
  createCanvas(width: number, height: number): CanvasLike
}

export interface ConversionResult {
  blob: Blob
  filename: string
  mimeType: SupportedImageMime
  inputFormat: ImageFormatCapability
  outputFormat: ImageFormatCapability
  originalBytes: number
  convertedBytes: number
  width: number
  height: number
}

export class ImageConversionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageConversionError'
  }
}

export function getFormatByMime(mimeType: string): ImageFormatCapability | undefined {
  return IMAGE_FORMATS.find((format) => format.mimeType === mimeType.toLowerCase())
}

export function getFormatByExtension(extension: string): ImageFormatCapability | undefined {
  const normalized = extension.toLowerCase().replace(/^\./, '')
  return IMAGE_FORMATS.find((format) => format.inputExtensions.includes(normalized))
}

export function resolveInputFormat(file: Pick<File, 'name' | 'type'>): ImageFormatCapability | undefined {
  return getFormatByMime(file.type) ?? getFormatByExtension(getExtension(file.name))
}

export function defaultOutputFor(input: ImageFormatCapability): ImageFormatCapability {
  return input.id === 'png'
    ? (getFormatByMime('image/webp') as ImageFormatCapability)
    : (getFormatByMime('image/png') as ImageFormatCapability)
}

async function decodeInBrowser(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      }
    } catch {
      // The image element fallback has broader support for some browser decoders.
    }
  }

  const url = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new ImageConversionError("That file couldn't be decoded as an image."))
      element.src = url
    })

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => {
        image.src = ''
        URL.revokeObjectURL(url)
      },
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

function createBrowserCanvas(width: number, height: number): CanvasLike {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas as unknown as CanvasLike
}

export const browserDeps: ConvertImageDeps = {
  decode: decodeInBrowser,
  createCanvas: createBrowserCanvas,
}

function encode(
  canvas: CanvasLike,
  format: ImageFormatCapability,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new ImageConversionError('The browser could not encode this image.'))
          return
        }

        if (blob.type !== format.mimeType) {
          reject(
            new ImageConversionError(
              `This browser cannot create ${format.label} images reliably. Choose another format.`,
            ),
          )
          return
        }

        resolve(blob)
      },
      format.mimeType,
      format.encoderQuality,
    )
  })
}

/** Converts one supported image locally without changing its decoded dimensions. */
export async function convertImage(
  file: File,
  outputMimeType: SupportedImageMime,
  deps: ConvertImageDeps = browserDeps,
): Promise<ConversionResult> {
  const inputFormat = resolveInputFormat(file)
  const outputFormat = getFormatByMime(outputMimeType)

  if (!inputFormat) {
    throw new ImageConversionError(`Choose a ${ACCEPTED_LABEL} image.`)
  }
  if (!outputFormat) {
    throw new ImageConversionError('Choose a supported output format.')
  }

  let decoded: DecodedImage
  try {
    decoded = await deps.decode(file)
  } catch (error) {
    if (error instanceof ImageConversionError) throw error
    throw new ImageConversionError("That file couldn't be decoded as an image.")
  }

  let canvas: CanvasLike | null = null

  try {
    if (decoded.width <= 0 || decoded.height <= 0) {
      throw new ImageConversionError("That file couldn't be decoded as an image.")
    }

    if (decoded.width * decoded.height > MAX_PIXELS) {
      throw new ImageConversionError(
        'This image is too large to convert safely in the browser. Its dimensions were not changed.',
      )
    }

    canvas = deps.createCanvas(decoded.width, decoded.height)
    const context = canvas.getContext('2d')

    if (!context) {
      throw new ImageConversionError('This browser blocked canvas access, so conversion failed.')
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    if (!outputFormat.supportsTransparency) {
      context.fillStyle = '#FFFFFF'
      context.fillRect(0, 0, decoded.width, decoded.height)
    }

    context.drawImage(decoded.source, 0, 0, decoded.width, decoded.height)
    const blob = await encode(canvas, outputFormat)

    return {
      blob,
      filename: buildOutputFilename(file.name, outputFormat.extension, '-converted'),
      mimeType: outputFormat.mimeType,
      inputFormat,
      outputFormat,
      originalBytes: file.size,
      convertedBytes: blob.size,
      width: decoded.width,
      height: decoded.height,
    }
  } finally {
    decoded.release()
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
  }
}
