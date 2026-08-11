import type { QrMatrix } from '@/tools/qr-generator/qrEncoder'
import type { QrAppearance } from '@/tools/qr-generator/types'

/**
 * Turning a matrix into something you can look at or save.
 *
 * Two outputs, one geometry: `toPath` builds the SVG path data that the
 * on-screen preview and the SVG download both use, and `toPngBlob` paints the
 * same modules onto a canvas. Keeping the geometry in one place is what stops
 * the downloaded file from differing from the preview.
 */

export const DEFAULT_APPEARANCE: QrAppearance = {
  size: 512,
  margin: 4,
  errorCorrection: 'M',
  foreground: '#000000',
  background: '#ffffff',
}

export const SIZE_OPTIONS = [256, 512, 1024] as const
export const MIN_MARGIN = 1
export const MAX_MARGIN = 8

/**
 * SVG path data covering every dark module, as one path.
 *
 * One path rather than a rect per module: a version 40 symbol is 31k modules,
 * and 31k DOM nodes in a live preview is a visibly janky page.
 *
 * Modules are drawn in module units; the caller scales via the viewBox, so the
 * path is independent of the pixel size and never accumulates rounding gaps
 * between neighbouring modules.
 */
export function toPath(matrix: QrMatrix, margin: number): string {
  const parts: string[] = []

  for (let row = 0; row < matrix.size; row += 1) {
    let run = 0

    for (let col = 0; col <= matrix.size; col += 1) {
      const dark = col < matrix.size && matrix.modules[row]![col] === true

      if (dark) {
        run += 1
        continue
      }

      // Horizontal runs are merged into one rectangle, which shrinks the path
      // a lot on the large light-on-dark areas and removes hairline seams
      // between adjacent modules when a renderer antialiases.
      if (run > 0) {
        parts.push(`M${col - run + margin} ${row + margin}h${run}v1h-${run}z`)
        run = 0
      }
    }
  }

  return parts.join('')
}

/** Edge length of the whole symbol in modules, quiet zone included. */
export function totalModules(matrix: QrMatrix, margin: number): number {
  return matrix.size + margin * 2
}

/** A complete, standalone SVG document. */
export function toSvg(matrix: QrMatrix, appearance: QrAppearance): string {
  const extent = totalModules(matrix, appearance.margin)
  const path = toPath(matrix, appearance.margin)

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${appearance.size}" height="${appearance.size}"`,
    ` viewBox="0 0 ${extent} ${extent}" shape-rendering="crispEdges">`,
    `<rect width="${extent}" height="${extent}" fill="${appearance.background}"/>`,
    `<path d="${path}" fill="${appearance.foreground}"/>`,
    '</svg>',
  ].join('')
}

/**
 * Paint the matrix onto a canvas at exactly `size` pixels.
 *
 * Module edges are snapped to whole pixels. Without that, a size that is not a
 * clean multiple of the module count leaves fractional-width modules that
 * antialias into grey, and a grey module is the thing that makes a QR fail to
 * scan at small sizes.
 */
export function drawToCanvas(
  canvas: HTMLCanvasElement,
  matrix: QrMatrix,
  appearance: QrAppearance,
): void {
  const extent = totalModules(matrix, appearance.margin)
  const scale = Math.max(1, Math.floor(appearance.size / extent))
  const pixels = extent * scale

  canvas.width = pixels
  canvas.height = pixels

  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas-unavailable')

  context.fillStyle = appearance.background
  context.fillRect(0, 0, pixels, pixels)

  context.fillStyle = appearance.foreground
  for (let row = 0; row < matrix.size; row += 1) {
    for (let col = 0; col < matrix.size; col += 1) {
      if (matrix.modules[row]![col] !== true) continue
      context.fillRect((col + appearance.margin) * scale, (row + appearance.margin) * scale, scale, scale)
    }
  }
}

/**
 * Render to a PNG Blob.
 *
 * The canvas is created, used and dropped here — nothing is added to the
 * document, and the blob is handed straight to the caller. No pixel data goes
 * anywhere else.
 */
export async function toPngBlob(matrix: QrMatrix, appearance: QrAppearance): Promise<Blob> {
  const canvas = document.createElement('canvas')
  drawToCanvas(canvas, matrix, appearance)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })

  if (!blob) throw new Error('png-unavailable')
  return blob
}

/** SVG as a downloadable Blob. */
export function toSvgBlob(matrix: QrMatrix, appearance: QrAppearance): Blob {
  return new Blob([toSvg(matrix, appearance)], { type: 'image/svg+xml' })
}

/* ------------------------------------------------------------------ *
 * Contrast
 * ------------------------------------------------------------------ */

function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value

  const channels = [0, 2, 4].map((offset) => {
    const channel = parseInt(full.slice(offset, offset + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

/** WCAG-style contrast ratio, used to warn before a QR becomes unscannable. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  const [light, dark] = a > b ? [a, b] : [b, a]

  return (light + 0.05) / (dark + 0.05)
}

/**
 * Scanners need a clear difference between dark and light modules, and they
 * also expect dark-on-light. Both failures are worth saying out loud, because
 * neither is visible until someone tries to scan the code and it does nothing.
 */
export function appearanceWarning(foreground: string, background: string): string | null {
  if (contrastRatio(foreground, background) < 4) {
    return 'These colours are too close together for most scanners to read. Try a darker foreground on a lighter background.'
  }

  if (relativeLuminance(foreground) > relativeLuminance(background)) {
    return 'Light code on a dark background is not read by every scanner app. A dark code on a light background is the safe choice.'
  }

  return null
}
