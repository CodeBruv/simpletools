import { buildOutputFilename, reductionPercent } from '@/lib/file'
import type {
  CanvasLike,
  CompressDeps,
  CompressOptions,
  CompressionResult,
  DecodedImage,
  OutputFormat,
} from '@/tools/image-compressor/types'

export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const
export const ACCEPTED_LABEL = 'JPG, PNG and WebP'
export const MAX_BYTES = 25 * 1024 * 1024

export const DEFAULT_QUALITY = 0.75
export const MIN_QUALITY = 0.1
export const MAX_QUALITY = 1

/**
 * Canvas area ceiling. Mobile Safari refuses to allocate a canvas larger than
 * roughly this, and silently produces a blank image instead of failing, so
 * anything bigger is scaled down before drawing.
 */
export const MAX_PIXELS = 16_777_216

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export class ImageCompressionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageCompressionError'
  }
}

/**
 * Pick the encoder for a given input.
 *
 * PNG is the interesting case: canvas PNG encoding is lossless and ignores the
 * quality argument, so re-encoding a PNG as PNG usually returns a *larger*
 * file. 'auto' therefore sends PNG to WebP, which is lossy, quality-controlled
 * and keeps the alpha channel.
 */
export function resolveOutputMime(inputType: string, format: OutputFormat): string {
  if (format !== 'auto') return format
  if (inputType === 'image/jpeg') return 'image/jpeg'
  return 'image/webp'
}

export function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return DEFAULT_QUALITY
  return Math.min(MAX_QUALITY, Math.max(MIN_QUALITY, quality))
}

/**
 * Scale dimensions down so width * height stays within MAX_PIXELS,
 * preserving aspect ratio. Returns the input untouched when it already fits.
 */
export function fitWithinPixelBudget(
  width: number,
  height: number,
  maxPixels = MAX_PIXELS,
): { width: number; height: number; scaled: boolean } {
  const pixels = width * height

  if (pixels <= maxPixels || pixels === 0) {
    return { width, height, scaled: false }
  }

  const ratio = Math.sqrt(maxPixels / pixels)
  return {
    width: Math.max(1, Math.floor(width * ratio)),
    height: Math.max(1, Math.floor(height * ratio)),
    scaled: true,
  }
}

async function decodeInBrowser(file: File): Promise<DecodedImage> {
  // createImageBitmap decodes off the main thread and needs no object URL.
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
      // Fall through to the <img> path below.
    }
  }

  const url = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () =>
        reject(new ImageCompressionError("That file couldn't be read as an image."))
      el.src = url
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

export const browserDeps: CompressDeps = {
  decode: decodeInBrowser,
  createCanvas: createBrowserCanvas,
}

function toBlobAsync(
  canvas: CanvasLike,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new ImageCompressionError('The browser could not encode this image.'))
      },
      mimeType,
      quality,
    )
  })
}

/**
 * Compress a single image entirely in the browser.
 *
 * The file is decoded, drawn once to a canvas and re-encoded. It is never read
 * as text, never evaluated, and never sent anywhere. Decoded pixels and the
 * canvas backing store are released before returning, including on failure.
 */
export async function compressImage(
  file: File,
  options: CompressOptions,
  deps: CompressDeps = browserDeps,
): Promise<CompressionResult> {
  const quality = clampQuality(options.quality)
  const requestedMime = resolveOutputMime(file.type, options.format)

  const decoded = await deps.decode(file)
  let canvas: CanvasLike | null = null

  try {
    if (decoded.width === 0 || decoded.height === 0) {
      throw new ImageCompressionError("That file couldn't be read as an image.")
    }

    const fitted = fitWithinPixelBudget(decoded.width, decoded.height)
    canvas = deps.createCanvas(fitted.width, fitted.height)

    const context = canvas.getContext('2d')
    if (!context) {
      throw new ImageCompressionError('This browser blocked canvas access, so compression failed.')
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    // JPEG has no alpha channel: without a matte, transparent pixels encode as
    // black. White matches the paper the result is most likely to land on.
    if (requestedMime === 'image/jpeg') {
      context.fillStyle = '#FFFFFF'
      context.fillRect(0, 0, fitted.width, fitted.height)
    }

    context.drawImage(decoded.source, 0, 0, fitted.width, fitted.height)

    const blob = await toBlobAsync(canvas, requestedMime, quality)

    // A browser that cannot encode the requested type falls back to PNG, so
    // trust the blob's own type when naming the file.
    const actualMime = blob.type || requestedMime
    const extension = EXTENSION_BY_MIME[actualMime] ?? 'img'
    const compressedBytes = blob.size

    return {
      blob,
      mimeType: actualMime,
      filename: buildOutputFilename(file.name, extension),
      originalBytes: file.size,
      compressedBytes,
      reductionPercent: reductionPercent(file.size, compressedBytes),
      didHelp: compressedBytes < file.size,
      width: fitted.width,
      height: fitted.height,
      originalWidth: decoded.width,
      originalHeight: decoded.height,
      wasDownscaled: fitted.scaled,
    }
  } finally {
    decoded.release()

    // Dropping the dimensions to zero frees the backing store immediately
    // rather than waiting for the canvas to be collected.
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
  }
}
