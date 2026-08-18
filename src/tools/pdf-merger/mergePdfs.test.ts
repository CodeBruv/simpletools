import assert from 'node:assert/strict'
import { test, describe } from 'node:test'

import {
  ACCEPTED_MIME_TYPES,
  MAX_TOTAL_BYTES,
  PDF_MIME_TYPE,
  PdfMergeError,
  browserEngine,
  findPdfHeaderOffset,
  inspectPdfFile,
  looksLikePdf,
  mergePdfs,
  type PdfMergeEngine,
} from './mergePdfs'

function pdfFile(name: string, bytes: Uint8Array, type = PDF_MIME_TYPE): File {
  return new File([bytes as BlobPart], name, { type })
}

function headerPdf(payload = 'fixture'): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.7\n${payload}`)
}

function fakeEngine(options: {
  inspect?: (bytes: Uint8Array) => Promise<{ pageCount: number }>
  merge?: PdfMergeEngine['merge']
} = {}): PdfMergeEngine {
  return {
    inspect: options.inspect ?? (async () => ({ pageCount: 1 })),
    merge:
      options.merge ??
      (async (inputs, onProgress) => {
        inputs.forEach((_, index) => onProgress?.(index + 1, inputs.length))
        return { bytes: headerPdf('merged'), pageCount: inputs.length }
      }),
  }
}

async function createPdf(pageSizes: Array<[number, number]>): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib')
  const document = await PDFDocument.create()
  for (const [width, height] of pageSizes) document.addPage([width, height])
  return document.save()
}

describe('PDF merger validation', () => {
  test('finds a PDF header only in the first kilobyte', () => {
    assert.equal(findPdfHeaderOffset(new TextEncoder().encode('junk%PDF-1.7')), 4)
    assert.equal(findPdfHeaderOffset(new Uint8Array(1024).fill(0x20)), -1)
    assert.equal(looksLikePdf(headerPdf()), true)
  })

  test('accepts a PDF extension when the browser omits the MIME type', async () => {
    const file = pdfFile('document.pdf', headerPdf(), '')
    const inspection = await inspectPdfFile(file, fakeEngine())
    assert.deepEqual(inspection, { pageCount: 1 })
  })

  test('accepts the declared PDF MIME type even when the extension is unusual', async () => {
    const file = pdfFile('document.bin', headerPdf(), ACCEPTED_MIME_TYPES[0])
    await assert.doesNotReject(() => inspectPdfFile(file, fakeEngine()))
  })

  test('rejects empty and non-PDF files before invoking the engine', async () => {
    let inspected = false
    const engine = fakeEngine({ inspect: async () => {
      inspected = true
      return { pageCount: 1 }
    } })

    await assert.rejects(
      () => inspectPdfFile(new File([], 'empty.pdf', { type: PDF_MIME_TYPE }), engine),
      /empty/,
    )
    await assert.rejects(
      () => inspectPdfFile(new File(['plain text'], 'notes.txt', { type: 'text/plain' }), engine),
      /isn't a PDF file/,
    )
    await assert.rejects(
      () => inspectPdfFile(pdfFile('fake.pdf', new TextEncoder().encode('not a PDF')), engine),
      /PDF header/,
    )
    assert.equal(inspected, false)
  })

  test('turns parser failures into friendly corrupt-file errors', async () => {
    const file = pdfFile('broken.pdf', headerPdf())
    await assert.rejects(
      () => inspectPdfFile(file, fakeEngine({ inspect: async () => { throw new Error('malformed xref') } })),
      (error: unknown) => error instanceof PdfMergeError && /broken\.pdf.*couldn't be read/.test(error.message),
    )
  })

  test('explains password-protected files without attempting to bypass them', async () => {
    const file = pdfFile('locked.pdf', headerPdf())
    await assert.rejects(
      () => inspectPdfFile(file, fakeEngine({ inspect: async () => { throw new Error('encrypted PDF requires password') } })),
      (error: unknown) => error instanceof PdfMergeError && /locked\.pdf is password-protected/.test(error.message),
    )
  })

  test('requires at least two files and enforces the aggregate memory limit', async () => {
    const one = pdfFile('one.pdf', headerPdf())
    await assert.rejects(() => mergePdfs([one], fakeEngine()), /at least two/)

    const oversized = [
      new File([new Uint8Array(MAX_TOTAL_BYTES / 2 + 1)], 'one.pdf', { type: PDF_MIME_TYPE }),
      new File([new Uint8Array(MAX_TOTAL_BYTES / 2 + 1)], 'two.pdf', { type: PDF_MIME_TYPE }),
    ]
    await assert.rejects(() => mergePdfs(oversized, fakeEngine()), /50 MB/)
  })
})

describe('PDF merger output', () => {
  test('merges multiple real PDFs in input order and preserves page sizes', async () => {
    const firstBytes = await createPdf([[300, 400], [500, 600]])
    const secondBytes = await createPdf([[700, 800]])
    const first = pdfFile('first.pdf', firstBytes)
    const second = pdfFile('second.pdf', secondBytes)
    const progress: Array<[number, number]> = []

    const result = await mergePdfs([first, second], browserEngine, (done, total) => {
      progress.push([done, total])
    })
    const { PDFDocument } = await import('pdf-lib')
    const merged = await PDFDocument.load(new Uint8Array(await result.blob.arrayBuffer()))

    assert.equal(result.fileCount, 2)
    assert.equal(result.pageCount, 3)
    assert.equal(result.blob.type, PDF_MIME_TYPE)
    assert.equal(looksLikePdf(new Uint8Array(await result.blob.arrayBuffer())), true)
    assert.deepEqual(progress, [[1, 2], [2, 2]])
    assert.deepEqual(merged.getPages().map((page) => [page.getWidth(), page.getHeight()]), [
      [300, 400],
      [500, 600],
      [700, 800],
    ])
  })

  test('passes exact file order and progress through an injected engine', async () => {
    const calls: Uint8Array[] = []
    const progress: Array<[number, number]> = []
    const engine = fakeEngine({
      merge: async (inputs, onProgress) => {
        for (let index = 0; index < inputs.length; index += 1) {
          const input = inputs[index]
          if (input) calls.push(input)
          onProgress?.(index + 1, inputs.length)
        }
        return { bytes: headerPdf('output'), pageCount: 4 }
      },
    })
    const first = pdfFile('first.pdf', headerPdf('first'))
    const second = pdfFile('second.pdf', headerPdf('second'))

    const result = await mergePdfs([second, first], engine, (done, total) => progress.push([done, total]))

    assert.equal(new TextDecoder().decode(calls[0]), new TextDecoder().decode(await second.arrayBuffer()).replace(/^/, ''))
    assert.equal(new TextDecoder().decode(calls[1]), new TextDecoder().decode(await first.arrayBuffer()).replace(/^/, ''))
    assert.equal(result.pageCount, 4)
    assert.equal(result.filename, 'merged.pdf')
    assert.deepEqual(progress, [[1, 2], [2, 2]])
  })

  test('rejects invalid engine output rather than offering a download', async () => {
    const files = [pdfFile('one.pdf', headerPdf()), pdfFile('two.pdf', headerPdf())]
    const engine = fakeEngine({ merge: async () => ({ bytes: new Uint8Array(), pageCount: 0 }) })
    await assert.rejects(() => mergePdfs(files, engine), /invalid file/)
  })
})
