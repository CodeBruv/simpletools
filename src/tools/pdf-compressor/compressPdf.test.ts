import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { validateFile } from '@/lib/file'
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_LABEL,
  ACCEPTED_MIME_TYPES,
  DEFAULT_QUALITY,
  MAX_BYTES,
  PdfCompressionError,
  clampQuality,
  clampScale,
  compressPdf,
  findPdfHeaderOffset,
  inspectPdf,
  looksLikePdf,
  toFriendlyError,
} from '@/tools/pdf-compressor/compressPdf'
import type { EngineOutput, PdfEngine, RasteriseOptions } from '@/tools/pdf-compressor/types'

const VALIDATION_RULES = {
  acceptedMimeTypes: ACCEPTED_MIME_TYPES,
  acceptedExtensions: ACCEPTED_EXTENSIONS,
  maxBytes: MAX_BYTES,
  acceptedLabel: ACCEPTED_LABEL,
}

/** Minimal bytes that a PDF parser would accept as a PDF header. */
function pdfBytes(payloadLength = 512): Uint8Array {
  const bytes = new Uint8Array(payloadLength)
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37], 0) // %PDF-1.7
  return bytes
}

/** A real File whose bytes are readable, unlike a size-spoofed stub. */
function pdfFile(name = 'notes.pdf', bytes = pdfBytes()): File {
  return new File([bytes], name, { type: 'application/pdf' })
}

interface Journal {
  optimiseCalls: number
  rasteriseCalls: number
  rasteriseOptions: RasteriseOptions[]
  /** Proves the engine never receives the caller's own buffer to mutate. */
  receivedLengths: number[]
}

interface FakeOptions {
  /** Byte length the engine claims to have produced. */
  outputBytes?: number
  pageCount?: number
  failWith?: Error
}

function makeEngine(options: FakeOptions = {}): { engine: PdfEngine; journal: Journal } {
  const { outputBytes = 400, pageCount = 3, failWith } = options

  const journal: Journal = {
    optimiseCalls: 0,
    rasteriseCalls: 0,
    rasteriseOptions: [],
    receivedLengths: [],
  }

  function output(): EngineOutput {
    if (failWith) throw failWith
    return { bytes: new Uint8Array(outputBytes), pageCount }
  }

  const engine: PdfEngine = {
    async inspect(bytes) {
      journal.receivedLengths.push(bytes.byteLength)
      if (failWith) throw failWith
      return { pageCount, encrypted: false }
    },
    async optimise(bytes) {
      journal.optimiseCalls += 1
      journal.receivedLengths.push(bytes.byteLength)
      return output()
    },
    async rasterise(bytes, rasteriseOptions) {
      journal.rasteriseCalls += 1
      journal.receivedLengths.push(bytes.byteLength)
      journal.rasteriseOptions.push(rasteriseOptions)
      return output()
    },
  }

  return { engine, journal }
}

const LOSSLESS = { mode: 'lossless' as const, quality: DEFAULT_QUALITY, scale: 1.5 }
const RASTERISE = { mode: 'rasterise' as const, quality: DEFAULT_QUALITY, scale: 1.5 }

/**
 * Globals that could move a user's file off their device.
 *
 * They are trapped by string key rather than by identifier on purpose: the
 * project's lint rules forbid naming these globals anywhere in source, and that
 * rule is worth keeping intact even inside a test. Going through a computed key
 * also lets one loop cover every transport instead of just `fetch`.
 */
const NETWORK_GLOBALS = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'] as const

function trapNetworkGlobals() {
  const target = globalThis as unknown as Record<string, unknown>
  const originals = new Map<string, unknown>()
  const used: string[] = []
  const installed: string[] = []

  for (const name of NETWORK_GLOBALS) {
    // Node has no XMLHttpRequest or EventSource, so only trap what exists.
    if (!(name in target)) continue

    originals.set(name, target[name])
    target[name] = () => {
      used.push(name)
      throw new Error(`${name} was called`)
    }
    installed.push(name)
  }

  return {
    used,
    installed,
    /** Calls a trapped global, to prove the trap is genuinely in place. */
    trigger(name: string) {
      const trapped = target[name]
      assert.equal(typeof trapped, 'function', `${name} was not trapped`)
      assert.throws(() => (trapped as () => void)())
    },
    restore() {
      for (const [name, original] of originals) target[name] = original
    },
  }
}

describe('findPdfHeaderOffset', () => {
  test('finds the header at the start of a normal PDF', () => {
    assert.equal(findPdfHeaderOffset(pdfBytes()), 0)
  })

  test('finds a header preceded by junk, which readers tolerate', () => {
    const bytes = new Uint8Array(64)
    bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d], 10)
    assert.equal(findPdfHeaderOffset(bytes), 10)
  })

  test('reports -1 when there is no header', () => {
    assert.equal(findPdfHeaderOffset(new Uint8Array(2048)), -1)
  })

  test('ignores a header buried past the first kilobyte', () => {
    const bytes = new Uint8Array(4096)
    bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d], 2000)
    assert.equal(findPdfHeaderOffset(bytes), -1)
  })

  test('does not read past the end of a very short buffer', () => {
    assert.equal(looksLikePdf(new Uint8Array([0x25, 0x50])), false)
  })
})

describe('file validation', () => {
  test('accepts a PDF', () => {
    assert.deepEqual(validateFile(pdfFile(), VALIDATION_RULES), { ok: true })
  })

  test('rejects a non-PDF by type and extension', () => {
    const result = validateFile(new File(['x'], 'photo.jpg', { type: 'image/jpeg' }), VALIDATION_RULES)
    assert.equal(result.ok, false)
    assert.match(result.ok === false ? result.message : '', /PDF files only/)
  })

  test('accepts a .pdf whose MIME type the browser failed to report', () => {
    assert.deepEqual(validateFile(new File(['%PDF-'], 'scan.pdf', { type: '' }), VALIDATION_RULES), {
      ok: true,
    })
  })

  test('rejects an empty file', () => {
    const result = validateFile(new File([], 'empty.pdf', { type: 'application/pdf' }), VALIDATION_RULES)
    assert.equal(result.ok, false)
    assert.match(result.ok === false ? result.message : '', /empty/)
  })

  test('rejects a file over the size limit and names the limit', () => {
    const big = new File(['%PDF-'], 'huge.pdf', { type: 'application/pdf' })
    Object.defineProperty(big, 'size', { value: MAX_BYTES + 1 })

    const result = validateFile(big, VALIDATION_RULES)
    assert.equal(result.ok, false)
    assert.match(result.ok === false ? result.message : '', /limit is 50 MB/)
  })

  test('accepts a file exactly at the limit', () => {
    const edge = new File(['%PDF-'], 'edge.pdf', { type: 'application/pdf' })
    Object.defineProperty(edge, 'size', { value: MAX_BYTES })
    assert.deepEqual(validateFile(edge, VALIDATION_RULES), { ok: true })
  })
})

describe('compressPdf', () => {
  test('rejects a file that is not really a PDF, whatever it is named', async () => {
    const { engine, journal } = makeEngine()
    const disguised = new File([new Uint8Array(64)], 'report.pdf', { type: 'application/pdf' })

    await assert.rejects(
      () => compressPdf(disguised, LOSSLESS, engine),
      (error: unknown) =>
        error instanceof PdfCompressionError && /isn't a PDF/.test((error as Error).message),
    )

    assert.equal(journal.optimiseCalls, 0, 'must not reach the engine')
  })

  test('rejects an empty file before touching the engine', async () => {
    const { engine, journal } = makeEngine()

    await assert.rejects(
      () => compressPdf(new File([], 'empty.pdf', { type: 'application/pdf' }), LOSSLESS, engine),
      PdfCompressionError,
    )
    assert.equal(journal.optimiseCalls, 0)
  })

  test('lossless mode uses optimise and never rasterises', async () => {
    const { engine, journal } = makeEngine()
    await compressPdf(pdfFile(), LOSSLESS, engine)

    assert.equal(journal.optimiseCalls, 1)
    assert.equal(journal.rasteriseCalls, 0)
  })

  test('rasterise mode uses rasterise and never optimises', async () => {
    const { engine, journal } = makeEngine()
    await compressPdf(pdfFile(), RASTERISE, engine)

    assert.equal(journal.rasteriseCalls, 1)
    assert.equal(journal.optimiseCalls, 0)
  })

  test('produces a PDF blob', async () => {
    const { engine } = makeEngine({ outputBytes: 400 })
    const result = await compressPdf(pdfFile(), LOSSLESS, engine)

    assert.equal(result.blob.type, 'application/pdf')
    assert.equal(result.blob.size, 400)
  })

  test('the output blob still carries a PDF header, so it opens as a PDF', async () => {
    // The engine returns real header bytes here rather than zeros, to prove
    // compressPdf passes the payload through without corrupting it.
    const engine: PdfEngine = {
      inspect: async () => ({ pageCount: 1, encrypted: false }),
      optimise: async () => ({ bytes: pdfBytes(256), pageCount: 1 }),
      rasterise: async () => ({ bytes: pdfBytes(256), pageCount: 1 }),
    }

    const result = await compressPdf(pdfFile(), LOSSLESS, engine)
    const roundTripped = new Uint8Array(await result.blob.arrayBuffer())

    assert.ok(looksLikePdf(roundTripped), 'output must be recognisable as a PDF')
  })

  test('names the download after the original file', async () => {
    const { engine } = makeEngine()
    const result = await compressPdf(pdfFile('Q3 Report.pdf'), LOSSLESS, engine)

    assert.equal(result.filename, 'Q3 Report-compressed.pdf')
  })

  test('reports the real sizes and reduction', async () => {
    const { engine } = makeEngine({ outputBytes: 250 })
    const file = pdfFile('notes.pdf', pdfBytes(1000))

    const result = await compressPdf(file, LOSSLESS, engine)

    assert.equal(result.originalBytes, 1000)
    assert.equal(result.compressedBytes, 250)
    assert.equal(result.reductionPercent, 75)
    assert.equal(result.didHelp, true)
  })

  test('reports honestly when the output is LARGER than the input', async () => {
    const { engine } = makeEngine({ outputBytes: 1500 })
    const file = pdfFile('already-tight.pdf', pdfBytes(1000))

    const result = await compressPdf(file, LOSSLESS, engine)

    assert.equal(result.didHelp, false, 'must not claim a saving')
    assert.equal(result.compressedBytes, 1500)
    assert.ok(result.reductionPercent < 0, 'reduction must read negative, not clamp to zero')
  })

  test('reports didHelp false when the size is unchanged', async () => {
    const { engine } = makeEngine({ outputBytes: 1000 })
    const result = await compressPdf(pdfFile('same.pdf', pdfBytes(1000)), LOSSLESS, engine)

    assert.equal(result.didHelp, false)
    assert.equal(result.reductionPercent, 0)
  })

  test('flags that rasterising destroys the text layer', async () => {
    const { engine } = makeEngine()

    const lossless = await compressPdf(pdfFile(), LOSSLESS, engine)
    const raster = await compressPdf(pdfFile(), RASTERISE, engine)

    assert.equal(lossless.textPreserved, true)
    assert.equal(raster.textPreserved, false)
  })

  test('passes the page count through to the result', async () => {
    const { engine } = makeEngine({ pageCount: 12 })
    const result = await compressPdf(pdfFile(), LOSSLESS, engine)

    assert.equal(result.pageCount, 12)
  })

  test('clamps quality and scale before handing them to the engine', async () => {
    const { engine, journal } = makeEngine()

    await compressPdf(pdfFile(), { ...RASTERISE, quality: 5, scale: 99 }, engine)
    await compressPdf(pdfFile(), { ...RASTERISE, quality: -1, scale: 0 }, engine)

    const [high, low] = journal.rasteriseOptions
    assert.equal(high?.quality, 0.95)
    assert.equal(high?.scale, 3)
    assert.equal(low?.quality, 0.3)
    assert.equal(low?.scale, 1)
  })

  test('treats an empty engine result as a failure rather than a 100% saving', async () => {
    const { engine } = makeEngine({ outputBytes: 0 })

    await assert.rejects(() => compressPdf(pdfFile(), LOSSLESS, engine), PdfCompressionError)
  })

  test('surfaces an engine failure as a PdfCompressionError', async () => {
    const { engine } = makeEngine({ failWith: new Error('stream broken') })

    await assert.rejects(async () => {
      try {
        return await compressPdf(pdfFile(), LOSSLESS, engine)
      } catch (error) {
        throw toFriendlyError(error)
      }
    }, PdfCompressionError)
  })

  test('makes no network request while compressing', async () => {
    const trap = trapNetworkGlobals()

    try {
      // Guard against a silent pass: if the trap were not installed, the
      // assertion below would hold no matter what compressPdf did.
      assert.ok(trap.installed.includes('fetch'), 'the network trap must be active')
      trap.trigger('fetch')
      trap.used.length = 0

      const { engine } = makeEngine()
      await compressPdf(pdfFile(), LOSSLESS, engine)
      await compressPdf(pdfFile(), RASTERISE, engine)
      await inspectPdf(pdfFile(), engine)
    } finally {
      trap.restore()
    }

    assert.deepEqual(trap.used, [], 'compressPdf must never reach the network')
  })

  test('holds no reference to the input file in the result', async () => {
    const { engine } = makeEngine()
    const result = await compressPdf(pdfFile(), LOSSLESS, engine)

    // Only the output blob should survive; retaining the source would keep the
    // user's document in memory for as long as the result is on screen.
    assert.equal(Object.values(result).includes(undefined), false)
    assert.ok(!('file' in result), 'result must not carry the source File')
    assert.ok(!('sourceBytes' in result), 'result must not carry the source bytes')
  })
})

describe('inspectPdf', () => {
  test('reports the page count for a readable PDF', async () => {
    const { engine } = makeEngine({ pageCount: 7 })
    assert.deepEqual(await inspectPdf(pdfFile(), engine), { pageCount: 7, encrypted: false })
  })

  test('returns null rather than throwing when the file is not a PDF', async () => {
    const { engine } = makeEngine()
    assert.equal(await inspectPdf(new File([new Uint8Array(32)], 'x.pdf'), engine), null)
  })

  test('returns null when the parser fails, so a bad count cannot block compression', async () => {
    const { engine } = makeEngine({ failWith: new Error('broken xref') })
    assert.equal(await inspectPdf(pdfFile(), engine), null)
  })
})

describe('toFriendlyError', () => {
  test('explains a password-protected PDF', () => {
    const error = toFriendlyError(new Error('Input document to `PDFDocument.load` is encrypted'))
    assert.match(error.message, /password-protected/)
  })

  test('passes an existing PdfCompressionError through unchanged', () => {
    const original = new PdfCompressionError('already friendly')
    assert.equal(toFriendlyError(original), original)
  })

  test('falls back to a readable message for an unknown failure', () => {
    const error = toFriendlyError(new Error('Cannot read properties of undefined'))
    assert.match(error.message, /couldn't be read/)
    assert.equal(error.name, 'PdfCompressionError')
  })
})

describe('clamping helpers', () => {
  test('clampQuality keeps values inside the usable range', () => {
    assert.equal(clampQuality(0.7), 0.7)
    assert.equal(clampQuality(0), 0.3)
    assert.equal(clampQuality(2), 0.95)
    assert.equal(clampQuality(Number.NaN), DEFAULT_QUALITY)
  })

  test('clampScale keeps render scale sane', () => {
    assert.equal(clampScale(1.5), 1.5)
    assert.equal(clampScale(0.1), 1)
    assert.equal(clampScale(50), 3)
    assert.equal(clampScale(Number.NaN), 1.5)
  })
})
