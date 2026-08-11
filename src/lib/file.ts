/**
 * Shared, tool-agnostic file helpers: size formatting, extension handling and
 * type/size validation. Tools supply their own accepted-type lists.
 */

const KB = 1024
const MB = KB * 1024

/**
 * Human-readable byte size. Uses binary units (what operating systems report)
 * so the number matches what the user sees in their file manager.
 */
export function formatBytes(bytes: number, fractionDigits?: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < KB) return `${Math.round(bytes)} B`

  const useMb = bytes >= MB
  const value = useMb ? bytes / MB : bytes / KB
  const unit = useMb ? 'MB' : 'KB'

  return `${value.toFixed(fractionDigits ?? 1)} ${unit}`
}

/**
 * Percentage saved going from `originalBytes` to `compressedBytes`.
 * Negative when the result grew.
 */
export function reductionPercent(originalBytes: number, compressedBytes: number): number {
  if (!Number.isFinite(originalBytes) || originalBytes <= 0) return 0
  if (!Number.isFinite(compressedBytes) || compressedBytes < 0) return 0
  return ((originalBytes - compressedBytes) / originalBytes) * 100
}

export function formatPercent(value: number, fractionDigits = 1): string {
  if (!Number.isFinite(value)) return '—'
  return `${value.toFixed(fractionDigits)}%`
}

/** `photo.final.JPEG` -> `photo.final` */
export function stripExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(0, dot) : filename
}

/** `photo.final.JPEG` -> `jpeg` (lowercase, no dot). Empty when absent. */
export function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(dot + 1).toLowerCase() : ''
}

/**
 * Build the output filename for a processed file, e.g.
 * ('holiday.png', 'jpg', '-compressed') -> 'holiday-compressed.jpg'
 */
export function buildOutputFilename(
  originalName: string,
  newExtension: string,
  suffix = '-compressed',
): string {
  const base = stripExtension(originalName).trim() || 'file'
  return `${base}${suffix}.${newExtension}`
}

export interface FileValidationRules {
  /** Accepted MIME types, e.g. ['image/jpeg', 'image/png']. */
  acceptedMimeTypes: readonly string[]
  /** Accepted extensions without dots, used when the browser reports no MIME type. */
  acceptedExtensions: readonly string[]
  maxBytes: number
  /** Human label for the accepted set, e.g. 'JPG, PNG or WebP'. */
  acceptedLabel: string
}

export type FileValidationResult = { ok: true } | { ok: false; message: string }

/**
 * Validate a user-selected file before any processing.
 *
 * Note this is a usability guard, not a security boundary: a MIME type is
 * self-reported. The real protection is that the file is only ever handed to
 * the browser's own image decoder, never executed or evaluated.
 */
export function validateFile(file: File, rules: FileValidationRules): FileValidationResult {
  if (file.size === 0) {
    return { ok: false, message: `${file.name} is empty. Pick a file with content in it.` }
  }

  const mimeOk = rules.acceptedMimeTypes.includes(file.type)
  const extensionOk = rules.acceptedExtensions.includes(getExtension(file.name))

  // Some browsers report an empty MIME type for files dragged from certain
  // apps, so fall back to the extension rather than rejecting a valid file.
  if (!mimeOk && !extensionOk) {
    return {
      ok: false,
      message: `${rules.acceptedLabel} files only. ${file.name} isn't one of those.`,
    }
  }

  if (file.size > rules.maxBytes) {
    return {
      ok: false,
      message: `${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(rules.maxBytes, 0)}.`,
    }
  }

  return { ok: true }
}
