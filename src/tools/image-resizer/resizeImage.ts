import { buildOutputFilename } from '@/lib/file'
import {
  ACCEPTED_LABEL,
  IMAGE_FORMATS,
  MAX_PIXELS,
  browserDeps,
  getFormatByMime,
  resolveInputFormat,
} from '@/tools/image-converter/convertImage'
import type {
  CanvasLike,
  ConvertImageDeps,
  ImageFormatCapability,
  SupportedImageMime,
} from '@/tools/image-converter/convertImage'

export type ResizeMode = 'exact' | 'percentage' | 'fit'

export interface ImageDimensions {
  width: number
  height: number
}

export interface ResizeRequest {
  mode: ResizeMode
  width?: number
  height?: number
  percentage?: number
  preserveAspectRatio?: boolean
}

export interface ResizeOptions {
  dimensions: ResizeRequest
  outputMimeType: SupportedImageMime
  quality: number
  targetBytes?: number
}

export interface InspectedImage extends ImageDimensions {
  inputFormat: ImageFormatCapability
}

export interface ResizeResult extends ImageDimensions {
  blob: Blob
  filename: string
  mimeType: SupportedImageMime
  inputFormat: ImageFormatCapability
  outputFormat: ImageFormatCapability
  originalWidth: number
  originalHeight: number
  originalBytes: number
  outputBytes: number
  quality: number | null
  targetBytes?: number
  targetMet: boolean
  attempts: number
}

export const DEFAULT_QUALITY = 0.9
export const MIN_QUALITY = 0.1
export const MAX_ENCODE_ATTEMPTS = 7

export class ImageResizeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageResizeError'
  }
}

function positiveInteger(value: number | undefined, label: string): number {
  if (!Number.isFinite(value) || !value || value <= 0) {
    throw new ImageResizeError(`Enter a valid ${label} greater than zero.`)
  }
  return Math.round(value)
}

function assertSafeDimensions(dimensions: ImageDimensions): ImageDimensions {
  if (dimensions.width * dimensions.height > MAX_PIXELS) {
    throw new ImageResizeError(
      'Those output dimensions are too large to create safely in this browser. Choose smaller dimensions.',
    )
  }
  return dimensions
}

export function calculateResizeDimensions(
  original: ImageDimensions,
  request: ResizeRequest,
): ImageDimensions {
  const originalWidth = positiveInteger(original.width, 'original width')
  const originalHeight = positiveInteger(original.height, 'original height')
  const ratio = originalWidth / originalHeight

  if (request.mode === 'percentage') {
    const percentage = positiveInteger(request.percentage, 'percentage')
    return assertSafeDimensions({
      width: Math.max(1, Math.round(originalWidth * percentage / 100)),
      height: Math.max(1, Math.round(originalHeight * percentage / 100)),
    })
  }

  if (request.mode === 'fit') {
    const maxWidth = positiveInteger(request.width, 'maximum width')
    const maxHeight = positiveInteger(request.height, 'maximum height')
    const scale = Math.min(maxWidth / originalWidth, maxHeight / originalHeight, 1)
    return assertSafeDimensions({
      width: Math.max(1, Math.round(originalWidth * scale)),
      height: Math.max(1, Math.round(originalHeight * scale)),
    })
  }

  const widthProvided = Number.isFinite(request.width) && Number(request.width) > 0
  const heightProvided = Number.isFinite(request.height) && Number(request.height) > 0
  if (!widthProvided && !heightProvided) {
    throw new ImageResizeError('Enter a width, a height, or both.')
  }

  if (request.preserveAspectRatio !== false) {
    if (widthProvided) {
      const width = positiveInteger(request.width, 'width')
      return assertSafeDimensions({ width, height: Math.max(1, Math.round(width / ratio)) })
    }
    const height = positiveInteger(request.height, 'height')
    return assertSafeDimensions({ width: Math.max(1, Math.round(height * ratio)), height })
  }

  return assertSafeDimensions({
    width: positiveInteger(request.width, 'width'),
    height: positiveInteger(request.height, 'height'),
  })
}

function validateDecodedDimensions(width: number, height: number): void {
  if (width <= 0 || height <= 0) {
    throw new ImageResizeError("That file couldn't be decoded as an image.")
  }
  if (width * height > MAX_PIXELS) {
    throw new ImageResizeError(
      'This image is too large to resize safely in the browser. The original was not changed.',
    )
  }
}

export async function inspectImage(
  file: File,
  deps: ConvertImageDeps = browserDeps,
): Promise<InspectedImage> {
  const inputFormat = resolveInputFormat(file)
  if (!inputFormat) throw new ImageResizeError(`Choose a ${ACCEPTED_LABEL} image.`)

  try {
    const decoded = await deps.decode(file)
    try {
      validateDecodedDimensions(decoded.width, decoded.height)
      return { width: decoded.width, height: decoded.height, inputFormat }
    } finally {
      decoded.release()
    }
  } catch (error) {
    if (error instanceof ImageResizeError) throw error
    throw new ImageResizeError("That file couldn't be decoded as an image.")
  }
}

function encodeCanvas(
  canvas: CanvasLike,
  format: ImageFormatCapability,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new ImageResizeError('The browser could not create the resized image.'))
        return
      }
      if (blob.type !== format.mimeType) {
        reject(
          new ImageResizeError(
            `This browser cannot create ${format.label} images reliably. Choose another format.`,
          ),
        )
        return
      }
      resolve(blob)
    }, format.mimeType, quality)
  })
}

interface EncodedResult {
  blob: Blob
  quality: number | null
  attempts: number
}

async function encodeForTarget(
  canvas: CanvasLike,
  format: ImageFormatCapability,
  requestedQuality: number,
  targetBytes?: number,
): Promise<EncodedResult> {
  const quality = Math.min(1, Math.max(MIN_QUALITY, requestedQuality))
  const first = await encodeCanvas(canvas, format, quality)
  if (!targetBytes || first.size <= targetBytes) {
    return { blob: first, quality: format.id === 'png' ? null : quality, attempts: 1 }
  }
  if (format.id === 'png') {
    throw new ImageResizeError(
      'PNG quality cannot be adjusted in the browser. Choose JPG or WebP to use a target file size.',
    )
  }

  const minimum = await encodeCanvas(canvas, format, MIN_QUALITY)
  if (minimum.size > targetBytes) {
    throw new ImageResizeError(
      'That target is too small at the requested dimensions. Choose a larger target or smaller dimensions.',
    )
  }

  let low = MIN_QUALITY
  let high = quality
  let best = minimum
  let bestQuality = MIN_QUALITY
  let attempts = 2

  while (attempts < MAX_ENCODE_ATTEMPTS) {
    const candidateQuality = (low + high) / 2
    const candidate = await encodeCanvas(canvas, format, candidateQuality)
    attempts += 1
    if (candidate.size <= targetBytes) {
      low = candidateQuality
      best = candidate
      bestQuality = candidateQuality
    } else {
      high = candidateQuality
    }
  }

  return { blob: best, quality: bestQuality, attempts }
}

export async function resizeImage(
  file: File,
  options: ResizeOptions,
  deps: ConvertImageDeps = browserDeps,
): Promise<ResizeResult> {
  const inputFormat = resolveInputFormat(file)
  const outputFormat = getFormatByMime(options.outputMimeType)
  if (!inputFormat) throw new ImageResizeError(`Choose a ${ACCEPTED_LABEL} image.`)
  if (!outputFormat || !IMAGE_FORMATS.includes(outputFormat)) {
    throw new ImageResizeError('Choose a supported output format.')
  }
  if (options.targetBytes !== undefined && (!Number.isFinite(options.targetBytes) || options.targetBytes <= 0)) {
    throw new ImageResizeError('Enter a target file size greater than zero.')
  }

  let decoded
  try {
    decoded = await deps.decode(file)
  } catch {
    throw new ImageResizeError("That file couldn't be decoded as an image.")
  }

  let canvas: CanvasLike | null = null
  try {
    validateDecodedDimensions(decoded.width, decoded.height)
    const dimensions = calculateResizeDimensions(decoded, options.dimensions)
    canvas = deps.createCanvas(dimensions.width, dimensions.height)
    const context = canvas.getContext('2d')
    if (!context) {
      throw new ImageResizeError('This browser blocked canvas access, so resizing failed.')
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    if (!outputFormat.supportsTransparency) {
      context.fillStyle = '#FFFFFF'
      context.fillRect(0, 0, dimensions.width, dimensions.height)
    }
    context.drawImage(decoded.source, 0, 0, dimensions.width, dimensions.height)

    const encoded = await encodeForTarget(
      canvas,
      outputFormat,
      options.quality,
      options.targetBytes,
    )

    return {
      blob: encoded.blob,
      filename: buildOutputFilename(file.name, outputFormat.extension, '-resized'),
      mimeType: outputFormat.mimeType,
      inputFormat,
      outputFormat,
      originalWidth: decoded.width,
      originalHeight: decoded.height,
      originalBytes: file.size,
      outputBytes: encoded.blob.size,
      width: dimensions.width,
      height: dimensions.height,
      quality: encoded.quality,
      targetBytes: options.targetBytes,
      targetMet: options.targetBytes === undefined || encoded.blob.size <= options.targetBytes,
      attempts: encoded.attempts,
    }
  } finally {
    decoded.release()
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
  }
}
