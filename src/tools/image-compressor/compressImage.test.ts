import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_QUALITY,
  ImageCompressionError,
  MAX_PIXELS,
  clampQuality,
  compressImage,
  fitWithinPixelBudget,
  resolveOutputMime,
} from '@/tools/image-compressor/compressImage'
import type {
  CanvasLike,
  CompressDeps,
  DecodedSource,
} from '@/tools/image-compressor/types'

/** A File with a controlled size, without allocating the bytes. */
function fakeFile(name: string, type: string, size: number): File {
  const file = new File([], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

interface Journal {
  canvases: Array<{ width: number; height: number }>
  fills: Array<{ style: string; args: number[] }>
  draws: Array<{ width: number; height: number }>
  encodes: Array<{ type: string | undefined; quality: number | undefined }>
  releases: number
  /** Canvas dimensions after compressImage's cleanup ran. */
  finalCanvasSize: Array<{ width: number; height: number }>
}

interface FakeOptions {
  width?: number
  height?: number
  /** Size of the blob the fake encoder returns. */
  encodedBytes?: number
  /** What the encoder claims it produced. Defaults to the requested type. */
  producedType?: string
  /** Simulate a browser that cannot encode at all. */
  encodeFails?: boolean
  /** Simulate a hardened browser refusing canvas access. */
  contextBlocked?: boolean
}

function makeDeps(options: FakeOptions = {}): { deps: CompressDeps; journal: Journal } {
  const {
    width = 1600,
    height = 1200,
    encodedBytes = 40_000,
    producedType,
    encodeFails = false,
    contextBlocked = false,
  } = options

  const journal: Journal = {
    canvases: [],
    fills: [],
    draws: [],
    encodes: [],
    releases: 0,
    finalCanvasSize: [],
  }

  const deps: CompressDeps = {
    async decode() {
      return {
        source: {} as DecodedSource,
        width,
        height,
        release() {
          journal.releases += 1
        },
      }
    },

    createCanvas(canvasWidth, canvasHeight) {
      journal.canvases.push({ width: canvasWidth, height: canvasHeight })

      const canvas: CanvasLike = {
        width: canvasWidth,
        height: canvasHeight,
        getContext() {
          if (contextBlocked) return null
          return {
            fillStyle: '',
            imageSmoothingEnabled: false,
            imageSmoothingQuality: 'low',
            fillRect(x, y, w, h) {
              journal.fills.push({ style: this.fillStyle, args: [x, y, w, h] })
            },
            drawImage(_source, _dx, _dy, dw, dh) {
              journal.draws.push({ width: dw, height: dh })
            },
          }
        },
        toBlob(callback, type, quality) {
          journal.encodes.push({ type, quality })
          if (encodeFails) {
            callback(null)
            return
          }
          const bytes = new Uint8Array(0)
          const blob = new Blob([bytes], { type: producedType ?? type })
          Object.defineProperty(blob, 'size', { value: encodedBytes })
          callback(blob)
        },
      }

      // Record the dimensions the compressor leaves behind on cleanup.
      journal.finalCanvasSize.push(canvas)
      return canvas
    },
  }

  return { deps, journal }
}

describe('resolveOutputMime', () => {
  test('keeps JPEG as JPEG', () => {
    assert.equal(resolveOutputMime('image/jpeg', 'auto'), 'image/jpeg')
  })

  test('routes PNG to WebP, because canvas PNG encoding ignores quality', () => {
    assert.equal(resolveOutputMime('image/png', 'auto'), 'image/webp')
  })

  test('keeps WebP as WebP', () => {
    assert.equal(resolveOutputMime('image/webp', 'auto'), 'image/webp')
  })

  test('an explicit format always wins over auto', () => {
    assert.equal(resolveOutputMime('image/png', 'image/jpeg'), 'image/jpeg')
    assert.equal(resolveOutputMime('image/jpeg', 'image/png'), 'image/png')
  })
})

describe('clampQuality', () => {
  test('holds the slider inside its range', () => {
    assert.equal(clampQuality(0), 0.1)
    assert.equal(clampQuality(-5), 0.1)
    assert.equal(clampQuality(2), 1)
    assert.equal(clampQuality(0.62), 0.62)
  })

  test('falls back to the default for nonsense', () => {
    assert.equal(clampQuality(Number.NaN), DEFAULT_QUALITY)
    assert.equal(clampQuality(Number.POSITIVE_INFINITY), DEFAULT_QUALITY)
  })
})

describe('fitWithinPixelBudget', () => {
  test('leaves an image that already fits completely alone', () => {
    assert.deepEqual(fitWithinPixelBudget(1920, 1080), {
      width: 1920,
      height: 1080,
      scaled: false,
    })
  })

  test('scales an oversized image under the budget', () => {
    const fitted = fitWithinPixelBudget(12_000, 9_000)
    assert.equal(fitted.scaled, true)
    assert.ok(fitted.width * fitted.height <= MAX_PIXELS)
  })

  test('preserves aspect ratio within a pixel', () => {
    const fitted = fitWithinPixelBudget(12_000, 9_000)
    assert.ok(Math.abs(fitted.width / fitted.height - 12_000 / 9_000) < 0.01)
  })

  test('never scales to zero', () => {
    const fitted = fitWithinPixelBudget(100_000, 2, 10)
    assert.ok(fitted.width >= 1)
    assert.ok(fitted.height >= 1)
  })
})

describe('compressImage', () => {
  test('reports the saving against the original file', async () => {
    const { deps } = makeDeps({ encodedBytes: 250_000 })
    const file = fakeFile('holiday.jpg', 'image/jpeg', 1_000_000)

    const result = await compressImage(file, { quality: 0.75, format: 'auto' }, deps)

    assert.equal(result.originalBytes, 1_000_000)
    assert.equal(result.compressedBytes, 250_000)
    assert.equal(Math.round(result.reductionPercent), 75)
    assert.equal(result.didHelp, true)
    assert.equal(result.filename, 'holiday-compressed.jpg')
  })

  test('admits it when the result came out larger', async () => {
    const { deps } = makeDeps({ encodedBytes: 1_400_000 })
    const file = fakeFile('already-tiny.jpg', 'image/jpeg', 1_000_000)

    const result = await compressImage(file, { quality: 0.9, format: 'auto' }, deps)

    assert.equal(result.didHelp, false)
    assert.ok(result.reductionPercent < 0)
  })

  test('names the file after what the encoder actually produced', async () => {
    // A browser without WebP encoding silently falls back to PNG.
    const { deps } = makeDeps({ producedType: 'image/png' })
    const file = fakeFile('logo.png', 'image/png', 500_000)

    const result = await compressImage(file, { quality: 0.8, format: 'auto' }, deps)

    assert.equal(result.mimeType, 'image/png')
    assert.equal(result.filename, 'logo-compressed.png')
  })

  test('passes the clamped quality to the encoder', async () => {
    const { deps, journal } = makeDeps()
    await compressImage(fakeFile('a.jpg', 'image/jpeg', 100), { quality: 9, format: 'auto' }, deps)

    assert.equal(journal.encodes.length, 1)
    assert.equal(journal.encodes[0]?.quality, 1)
    assert.equal(journal.encodes[0]?.type, 'image/jpeg')
  })

  test('paints a white matte before drawing to JPEG, which has no alpha', async () => {
    const { deps, journal } = makeDeps()
    await compressImage(
      fakeFile('transparent.png', 'image/png', 100),
      { quality: 0.8, format: 'image/jpeg' },
      deps,
    )

    assert.equal(journal.fills.length, 1)
    assert.equal(journal.fills[0]?.style, '#FFFFFF')
  })

  test('does not matte WebP, so transparency survives', async () => {
    const { deps, journal } = makeDeps()
    await compressImage(
      fakeFile('transparent.png', 'image/png', 100),
      { quality: 0.8, format: 'auto' },
      deps,
    )

    assert.equal(journal.fills.length, 0)
  })

  test('draws once', async () => {
    const { deps, journal } = makeDeps()
    await compressImage(fakeFile('a.jpg', 'image/jpeg', 100), { quality: 0.8, format: 'auto' }, deps)

    assert.equal(journal.draws.length, 1)
  })

  test('scales a huge image down and says so', async () => {
    const { deps, journal } = makeDeps({ width: 12_000, height: 9_000 })
    const result = await compressImage(
      fakeFile('massive.jpg', 'image/jpeg', 20_000_000),
      { quality: 0.8, format: 'auto' },
      deps,
    )

    assert.equal(result.wasDownscaled, true)
    assert.equal(result.originalWidth, 12_000)
    assert.ok(result.width < 12_000)
    assert.ok(result.width * result.height <= MAX_PIXELS)
    // The canvas is allocated at the reduced size, not the original.
    assert.equal(journal.canvases[0]?.width, result.width)
  })

  test('leaves normal images at their original size', async () => {
    const { deps } = makeDeps({ width: 1600, height: 1200 })
    const result = await compressImage(
      fakeFile('a.jpg', 'image/jpeg', 100),
      { quality: 0.8, format: 'auto' },
      deps,
    )

    assert.equal(result.wasDownscaled, false)
    assert.equal(result.width, 1600)
    assert.equal(result.height, 1200)
  })
})

describe('compressImage resource cleanup', () => {
  test('releases decoded pixels and frees the canvas on success', async () => {
    const { deps, journal } = makeDeps()
    await compressImage(fakeFile('a.jpg', 'image/jpeg', 100), { quality: 0.8, format: 'auto' }, deps)

    assert.equal(journal.releases, 1)
    assert.equal(journal.finalCanvasSize[0]?.width, 0)
    assert.equal(journal.finalCanvasSize[0]?.height, 0)
  })

  test('releases decoded pixels and frees the canvas when encoding fails', async () => {
    const { deps, journal } = makeDeps({ encodeFails: true })

    await assert.rejects(
      compressImage(fakeFile('a.jpg', 'image/jpeg', 100), { quality: 0.8, format: 'auto' }, deps),
      ImageCompressionError,
    )

    assert.equal(journal.releases, 1)
    assert.equal(journal.finalCanvasSize[0]?.width, 0)
  })

  test('releases decoded pixels when the file decodes to nothing', async () => {
    const { deps, journal } = makeDeps({ width: 0, height: 0 })

    await assert.rejects(
      compressImage(fakeFile('corrupt.jpg', 'image/jpeg', 100), { quality: 0.8, format: 'auto' }, deps),
      /couldn't be read as an image/,
    )

    assert.equal(journal.releases, 1)
  })

  test('explains itself when the browser blocks canvas access', async () => {
    const { deps, journal } = makeDeps({ contextBlocked: true })

    await assert.rejects(
      compressImage(fakeFile('a.jpg', 'image/jpeg', 100), { quality: 0.8, format: 'auto' }, deps),
      /canvas/i,
    )

    assert.equal(journal.releases, 1)
  })
})

describe('compressImage privacy', () => {
  const originals: Record<string, unknown> = {}

  beforeEach(() => {
    for (const key of ['fetch', 'XMLHttpRequest', 'WebSocket', 'sendBeacon']) {
      originals[key] = (globalThis as Record<string, unknown>)[key]
    }

    const forbid = (name: string) => () => {
      throw new Error(`compressImage attempted a network call via ${name}`)
    }

    Object.assign(globalThis as Record<string, unknown>, {
      fetch: forbid('fetch'),
      XMLHttpRequest: forbid('XMLHttpRequest'),
      WebSocket: forbid('WebSocket'),
      sendBeacon: forbid('sendBeacon'),
    })
  })

  afterEach(() => {
    Object.assign(globalThis as Record<string, unknown>, originals)
  })

  test('compresses without touching fetch, XHR, WebSocket or sendBeacon', async () => {
    const { deps } = makeDeps({ encodedBytes: 1234 })
    const result = await compressImage(
      fakeFile('private.jpg', 'image/jpeg', 9999),
      { quality: 0.7, format: 'auto' },
      deps,
    )

    assert.equal(result.compressedBytes, 1234)
  })
})
