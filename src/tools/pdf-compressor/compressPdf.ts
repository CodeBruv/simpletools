import { buildOutputFilename, reductionPercent } from '@/lib/file'
import type {
  CompressPdfOptions,
  EngineOutput,
  PdfCompressionResult,
  PdfEngine,
  PdfInspection,
  RasteriseOptions,
} from '@/tools/pdf-compressor/types'

export const ACCEPTED_MIME_TYPES = ['application/pdf'] as const
export const ACCEPTED_EXTENSIONS = ['pdf'] as const
export const ACCEPTED_LABEL = 'PDF'

/**
 * Rasterising holds a decoded page bitmap, a JPEG and the growing output in
 * memory at once. Past roughly this size that becomes unreliable on mobile,
 * so the file is refused with a clear message rather than crashing the tab.
 */
export const MAX_BYTES = 50 * 1024 * 1024

export const DEFAULT_QUALITY = 0.7
export const MIN_QUALITY = 0.3
export const MAX_QUALITY = 0.95

export const DEFAULT_SCALE = 1.5

/** Below this, calling the result "compressed" would be overselling it. */
export const MEANINGFUL_REDUCTION_PERCENT = 1

export class PdfCompressionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PdfCompressionError'
  }
}

/**
 * Byte offset of the `%PDF-` header, or -1 if it isn't in the first 1 KB.
 *
 * A MIME type is self-reported and an extension is just a name, so this is the
 * only check here that actually looks at the file. Readers tolerate junk before
 * the header, so it is searched for rather than required at offset 0.
 */
export function findPdfHeaderOffset(bytes: Uint8Array): number {
  const limit = Math.min(bytes.length, 1024)

  for (let i = 0; i + 5 <= limit; i += 1) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 && // F
      bytes[i + 4] === 0x2d // -
    ) {
      return i
    }
  }

  return -1
}

export function looksLikePdf(bytes: Uint8Array): boolean {
  return findPdfHeaderOffset(bytes) !== -1
}

export function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return DEFAULT_QUALITY
  return Math.min(MAX_QUALITY, Math.max(MIN_QUALITY, quality))
}

export function clampScale(scale: number): number {
  if (!Number.isFinite(scale)) return DEFAULT_SCALE
  return Math.min(3, Math.max(1, scale))
}

/**
 * Turn a library-level failure into something a person can act on.
 * pdf-lib throws distinct errors for encrypted and structurally broken files.
 */
export function toFriendlyError(error: unknown): PdfCompressionError {
  if (error instanceof PdfCompressionError) return error

  const name = error instanceof Error ? error.name : ''
  const message = error instanceof Error ? error.message : ''
  const combined = `${name} ${message}`.toLowerCase()

  if (combined.includes('encrypt') || combined.includes('password')) {
    return new PdfCompressionError(
      'This PDF is password-protected, so it cannot be opened for compression. Remove the password and try again.',
    )
  }

  if (combined.includes('abort')) {
    return new PdfCompressionError('Compression was cancelled.')
  }

  return new PdfCompressionError(
    "This PDF couldn't be read. It may be damaged or use a feature the browser can't parse.",
  )
}

/* ------------------------------------------------------------------ *
 * Browser engine
 *
 * Every import below is dynamic. The libraries are only fetched once a
 * user actually compresses something, so no other page pays for them.
 * ------------------------------------------------------------------ */

async function loadPdfLib() {
  const { PDFDocument } = await import('pdf-lib')
  return PDFDocument
}

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist')

  // pdf.js runs its parser in a worker. Pointing at the bundled copy keeps it
  // local: the default would reach for a CDN, which this product must not do.
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  }

  return pdfjs
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new PdfCompressionError('The browser could not encode a page image.'))
      },
      'image/jpeg',
      quality,
    )
  })
}

async function inspectInBrowser(bytes: Uint8Array): Promise<PdfInspection> {
  const PDFDocument = await loadPdfLib()

  try {
    // A copy is passed because pdf-lib takes ownership of the buffer it parses.
    const doc = await PDFDocument.load(bytes.slice(), { updateMetadata: false })
    return { pageCount: doc.getPageCount(), encrypted: false }
  } catch (error) {
    const friendly = toFriendlyError(error)
    if (friendly.message.includes('password-protected')) {
      return { pageCount: 0, encrypted: true }
    }
    throw friendly
  }
}

async function optimiseInBrowser(bytes: Uint8Array): Promise<EngineOutput> {
  const PDFDocument = await loadPdfLib()

  try {
    // updateMetadata: false keeps pdf-lib from stamping its own Producer and
    // ModDate onto the user's document.
    const doc = await PDFDocument.load(bytes.slice(), { updateMetadata: false })

    // Object streams pack many small objects into one compressed stream, and
    // re-serialising drops anything no longer reachable from the trailer —
    // which is where the saving on a heavily-edited PDF comes from.
    const saved = await doc.save({ useObjectStreams: true })

    return { bytes: saved, pageCount: doc.getPageCount() }
  } catch (error) {
    throw toFriendlyError(error)
  }
}

async function rasteriseInBrowser(
  bytes: Uint8Array,
  { quality, scale, signal, onProgress }: RasteriseOptions,
): Promise<EngineOutput> {
  const [PDFDocument, pdfjs] = await Promise.all([loadPdfLib(), loadPdfJs()])
  const loadingTask = pdfjs.getDocument({ data: bytes.slice() })

  try {
    const source = await loadingTask.promise
    const output = await PDFDocument.create()
    const pageCount = source.numPages

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      if (signal?.aborted) throw new PdfCompressionError('Compression was cancelled.')

      const page = await source.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.floor(viewport.width))
      canvas.height = Math.max(1, Math.floor(viewport.height))

      // pdf.js renders into the canvas element itself. Asking for the 2D
      // context here is only a check: a browser with canvas blocked returns
      // null, and failing now reads better than failing later at encode time.
      if (!canvas.getContext('2d')) {
        throw new PdfCompressionError('This browser blocked canvas access, so compression failed.')
      }

      try {
        // JPEG has no alpha channel, so the page needs an opaque backdrop or
        // transparent areas encode as black. This matches pdf.js's own default
        // and is passed explicitly because the output depends on it.
        await page.render({ canvas, viewport, background: '#FFFFFF' }).promise

        const jpeg = await canvasToBlob(canvas, quality)
        const embedded = await output.embedJpg(new Uint8Array(await jpeg.arrayBuffer()))

        // The new page keeps the original's dimensions in PDF points, so the
        // document still prints and reads at its intended physical size.
        const natural = page.getViewport({ scale: 1 })
        const target = output.addPage([natural.width, natural.height])
        target.drawImage(embedded, {
          x: 0,
          y: 0,
          width: natural.width,
          height: natural.height,
        })
      } finally {
        // Release the bitmap now rather than waiting for collection; a long
        // document would otherwise hold every page's pixels at once.
        canvas.width = 0
        canvas.height = 0
        page.cleanup()
      }

      onProgress?.(pageNumber, pageCount)
    }

    return { bytes: await output.save({ useObjectStreams: true }), pageCount }
  } catch (error) {
    throw toFriendlyError(error)
  } finally {
    // Cleanup hangs off the loading task, not the document proxy: it disposes
    // the parsed document and terminates the parser worker. Doing it here
    // rather than inside the try means it also runs when the document failed
    // to open at all, which is exactly when a worker would otherwise be left
    // running. A failure to clean up must not replace the real error, so it is
    // deliberately swallowed.
    try {
      await loadingTask.destroy()
    } catch {
      // Nothing useful to do: the page is already unwinding.
    }
  }
}

export const browserEngine: PdfEngine = {
  inspect: inspectInBrowser,
  optimise: optimiseInBrowser,
  rasterise: rasteriseInBrowser,
}

/* ------------------------------------------------------------------ */

/**
 * Read a PDF's page count before compressing, for the pre-flight readout.
 * Returns null when the file can't be parsed — the count is a nicety, so a
 * failure here must not block the user from trying to compress.
 */
export async function inspectPdf(
  file: File,
  engine: PdfEngine = browserEngine,
): Promise<PdfInspection | null> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (!looksLikePdf(bytes)) return null
    return await engine.inspect(bytes)
  } catch {
    return null
  }
}

/**
 * Compress a single PDF entirely in the browser.
 *
 * The file is read into memory, handed to a parser, and rebuilt. It is never
 * uploaded, never evaluated as code, and never written to storage. The returned
 * result holds only the output blob, so the input bytes become collectable as
 * soon as this returns.
 *
 * The result reports what actually happened, including the case where the
 * output is no smaller — a real and common outcome for PDFs that are already
 * well built.
 */
export async function compressPdf(
  file: File,
  options: CompressPdfOptions,
  engine: PdfEngine = browserEngine,
): Promise<PdfCompressionResult> {
  const bytes = new Uint8Array(await file.arrayBuffer())

  if (bytes.length === 0) {
    throw new PdfCompressionError('That file is empty.')
  }

  if (!looksLikePdf(bytes)) {
    throw new PdfCompressionError(
      "That file isn't a PDF. Its contents don't start with a PDF header, whatever the name says.",
    )
  }

  const rasterise = options.mode === 'rasterise'

  const output = rasterise
    ? await engine.rasterise(bytes, {
        quality: clampQuality(options.quality),
        scale: clampScale(options.scale),
        signal: options.signal,
        onProgress: options.onProgress,
      })
    : await engine.optimise(bytes, options.signal)

  const compressedBytes = output.bytes.byteLength

  if (compressedBytes === 0) {
    throw new PdfCompressionError('Compression produced an empty file, so the original was kept.')
  }

  // Copying into the Blob lets the engine's buffer go, leaving one copy held.
  const blob = new Blob([output.bytes], { type: 'application/pdf' })

  return {
    blob,
    filename: buildOutputFilename(file.name, 'pdf'),
    mode: options.mode,
    originalBytes: file.size,
    compressedBytes,
    reductionPercent: reductionPercent(file.size, compressedBytes),
    didHelp: compressedBytes < file.size,
    pageCount: output.pageCount,
    textPreserved: !rasterise,
  }
}
