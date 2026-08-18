import { getExtension } from '@/lib/file'

export const PDF_MIME_TYPE = 'application/pdf'
export const ACCEPTED_MIME_TYPES = [PDF_MIME_TYPE] as const
export const ACCEPTED_EXTENSIONS = ['pdf'] as const
export const ACCEPTED_LABEL = 'PDF'

/**
 * The PDF Compressor established 50 MB as the browser-side PDF memory budget.
 * Merging applies that budget to the whole selected set because inputs and the
 * growing output coexist while pages are copied.
 */
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024

export interface PdfFileInspection {
  pageCount: number
}

export interface PdfMergeOutput {
  bytes: Uint8Array
  pageCount: number
}

export interface PdfMergeResult {
  blob: Blob
  filename: string
  pageCount: number
  fileCount: number
  inputBytes: number
  outputBytes: number
}

export interface PdfMergeEngine {
  inspect(bytes: Uint8Array): Promise<PdfFileInspection>
  merge(inputs: readonly Uint8Array[], onProgress?: (done: number, total: number) => void): Promise<PdfMergeOutput>
}

export class PdfMergeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PdfMergeError'
  }
}

class PdfSourceError extends Error {
  readonly sourceIndex: number

  constructor(sourceIndex: number, cause: unknown) {
    super(cause instanceof Error ? cause.message : 'PDF source failed')
    this.name = 'PdfSourceError'
    this.sourceIndex = sourceIndex
  }
}

export function findPdfHeaderOffset(bytes: Uint8Array): number {
  const limit = Math.min(bytes.length, 1024)

  for (let i = 0; i + 5 <= limit; i += 1) {
    if (
      bytes[i] === 0x25 &&
      bytes[i + 1] === 0x50 &&
      bytes[i + 2] === 0x44 &&
      bytes[i + 3] === 0x46 &&
      bytes[i + 4] === 0x2d
    ) {
      return i
    }
  }

  return -1
}

export function looksLikePdf(bytes: Uint8Array): boolean {
  return findPdfHeaderOffset(bytes) !== -1
}

function isEncryptedError(error: unknown): boolean {
  const name = error instanceof Error ? error.name : ''
  const message = error instanceof Error ? error.message : ''
  return `${name} ${message}`.toLowerCase().match(/encrypt|password/) !== null
}

function unreadableMessage(filename: string, error: unknown): string {
  if (isEncryptedError(error)) {
    return `${filename} is password-protected. Remove the password, then add the file again.`
  }

  return `${filename} couldn't be read. It may be damaged or use a PDF feature this browser can't parse.`
}

function validateSelectionFile(file: File): void {
  if (file.size === 0) throw new PdfMergeError(`${file.name} is empty.`)

  const mimeOk = file.type === PDF_MIME_TYPE
  const extensionOk = getExtension(file.name) === 'pdf'
  if (!mimeOk && !extensionOk) {
    throw new PdfMergeError(`${file.name} isn't a PDF file.`)
  }
}

async function readPdf(file: File): Promise<Uint8Array> {
  validateSelectionFile(file)
  const bytes = new Uint8Array(await file.arrayBuffer())

  if (!looksLikePdf(bytes)) {
    throw new PdfMergeError(
      `${file.name} isn't a readable PDF. Its contents don't contain a PDF header.`,
    )
  }

  return bytes
}

async function loadPdfLib() {
  const { PDFDocument } = await import('pdf-lib')
  return PDFDocument
}

export const browserEngine: PdfMergeEngine = {
  async inspect(bytes) {
    const PDFDocument = await loadPdfLib()
    const document = await PDFDocument.load(bytes.slice(), { updateMetadata: false })
    return { pageCount: document.getPageCount() }
  },

  async merge(inputs, onProgress) {
    const PDFDocument = await loadPdfLib()
    const output = await PDFDocument.create()
    let pageCount = 0

    for (let index = 0; index < inputs.length; index += 1) {
      const input = inputs[index]
      if (!input) throw new PdfSourceError(index, new Error('PDF source is missing'))

      try {
        const source = await PDFDocument.load(input.slice(), { updateMetadata: false })
        const pages = await output.copyPages(source, source.getPageIndices())
        for (const page of pages) output.addPage(page)
        pageCount += pages.length
        onProgress?.(index + 1, inputs.length)
      } catch (error) {
        throw new PdfSourceError(index, error)
      }
    }

    return {
      bytes: await output.save({ useObjectStreams: true }),
      pageCount,
    }
  },
}

export async function inspectPdfFile(
  file: File,
  engine: PdfMergeEngine = browserEngine,
): Promise<PdfFileInspection> {
  const bytes = await readPdf(file)

  try {
    const inspection = await engine.inspect(bytes)
    if (inspection.pageCount < 1) throw new Error('PDF has no pages')
    return inspection
  } catch (error) {
    if (error instanceof PdfMergeError) throw error
    throw new PdfMergeError(unreadableMessage(file.name, error))
  }
}

export async function mergePdfs(
  files: readonly File[],
  engine: PdfMergeEngine = browserEngine,
  onProgress?: (done: number, total: number) => void,
): Promise<PdfMergeResult> {
  if (files.length < 2) {
    throw new PdfMergeError('Add at least two PDF files before merging.')
  }

  const inputBytes = files.reduce((total, file) => total + file.size, 0)
  if (inputBytes > MAX_TOTAL_BYTES) {
    throw new PdfMergeError('Those files total more than 50 MB. Remove one or more files and try again.')
  }

  const inputs: Uint8Array[] = []
  for (const file of files) inputs.push(await readPdf(file))

  let output: PdfMergeOutput
  try {
    output = await engine.merge(inputs, onProgress)
  } catch (error) {
    if (error instanceof PdfSourceError) {
      const file = files[error.sourceIndex]
      throw new PdfMergeError(unreadableMessage(file?.name ?? 'One PDF', error))
    }
    throw new PdfMergeError("The PDFs couldn't be merged. One file may be damaged or unsupported.")
  }

  if (output.bytes.byteLength === 0 || output.pageCount < 1 || !looksLikePdf(output.bytes)) {
    throw new PdfMergeError('Merging produced an invalid file, so no download was created.')
  }

  const blob = new Blob([output.bytes as BlobPart], { type: PDF_MIME_TYPE })
  return {
    blob,
    filename: 'merged.pdf',
    pageCount: output.pageCount,
    fileCount: files.length,
    inputBytes,
    outputBytes: blob.size,
  }
}
