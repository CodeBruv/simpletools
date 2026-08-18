import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { IMAGE_FORMATS, MAX_PIXELS } from '@/tools/image-converter/convertImage'
import { calculateResizeDimensions, resizeImage } from '@/tools/image-resizer/resizeImage'
import type { CanvasLike, ConvertImageDeps } from '@/tools/image-converter/convertImage'

function fakeFile(name: string, type: string, size = 1000): File {
  return { name, type, size } as File
}

interface Journal {
  canvases: Array<[number, number]>
  draws: Array<[number, number]>
  fills: number
  encodes: number
  qualities: Array<number | undefined>
  released: number
  freed: boolean
}

function makeDeps(options: { width?: number; height?: number; sizes?: number[] } = {}): {
  deps: ConvertImageDeps
  journal: Journal
} {
  const journal: Journal = {
    canvases: [],
    draws: [],
    fills: 0,
    encodes: 0,
    qualities: [],
    released: 0,
    freed: false,
  }
  const sizes = options.sizes ?? [400]
  const deps: ConvertImageDeps = {
    async decode() {
      return {
        source: {} as CanvasImageSource,
        width: options.width ?? 400,
        height: options.height ?? 300,
        release: () => {
          journal.released += 1
        },
      }
    },
    createCanvas(width, height) {
      journal.canvases.push([width, height])
      let canvasWidth = width
      let canvasHeight = height
      const canvas: CanvasLike = {
        get width() {
          return canvasWidth
        },
        set width(value) {
          canvasWidth = value
          if (canvasWidth === 0 && canvasHeight === 0) journal.freed = true
        },
        get height() {
          return canvasHeight
        },
        set height(value) {
          canvasHeight = value
          if (canvasWidth === 0 && canvasHeight === 0) journal.freed = true
        },
        getContext() {
          return {
            fillStyle: '',
            imageSmoothingEnabled: false,
            imageSmoothingQuality: 'low',
            fillRect() {
              journal.fills += 1
            },
            drawImage(_source, _x, _y, targetWidth, targetHeight) {
              journal.draws.push([targetWidth, targetHeight])
            },
          }
        },
        toBlob(callback, type, quality) {
          const size = sizes[Math.min(journal.encodes, sizes.length - 1)] ?? 400
          journal.encodes += 1
          journal.qualities.push(quality)
          callback(new Blob([new Uint8Array(size)], { type }))
        },
      }
      return canvas
    },
  }
  return { deps, journal }
}

describe('resize dimension calculations', () => {
  test('supports exact dimensions with a locked ratio', () => {
    assert.deepEqual(
      calculateResizeDimensions(
        { width: 4000, height: 3000 },
        { mode: 'exact', width: 1200 },
      ),
      { width: 1200, height: 900 },
    )
  })

  test('supports independent exact dimensions when unlocked', () => {
    assert.deepEqual(
      calculateResizeDimensions(
        { width: 400, height: 300 },
        { mode: 'exact', width: 800, height: 500, preserveAspectRatio: false },
      ),
      { width: 800, height: 500 },
    )
  })

  test('supports width-only, height-only, and percentage modes', () => {
    assert.deepEqual(
      calculateResizeDimensions({ width: 400, height: 300 }, { mode: 'exact', width: 200 }),
      { width: 200, height: 150 },
    )
    assert.deepEqual(
      calculateResizeDimensions({ width: 400, height: 300 }, { mode: 'exact', height: 600 }),
      { width: 800, height: 600 },
    )
    assert.deepEqual(
      calculateResizeDimensions(
        { width: 400, height: 300 },
        { mode: 'percentage', percentage: 50 },
      ),
      { width: 200, height: 150 },
    )
  })

  test('fits inside both maximums without cropping', () => {
    assert.deepEqual(
      calculateResizeDimensions(
        { width: 4000, height: 3000 },
        { mode: 'fit', width: 1920, height: 1920 },
      ),
      { width: 1920, height: 1440 },
    )
  })

  test('rejects unsafe output dimensions', () => {
    assert.throws(
      () => calculateResizeDimensions({ width: 1000, height: 1000 }, { mode: 'percentage', percentage: 5000 }),
      /too large/,
    )
  })

  test('uses the established pixel safety ceiling', () => {
    assert.equal(MAX_PIXELS, 16_777_216)
  })
})

describe('resizeImage processing', () => {
  test('draws requested dimensions, preserves transparency, names output, and cleans up', async () => {
    const { deps, journal } = makeDeps()
    const result = await resizeImage(
      fakeFile('logo.png', 'image/png'),
      {
        dimensions: { mode: 'exact', width: 200 },
        outputMimeType: 'image/webp',
        quality: 0.8,
      },
      deps,
    )
    assert.deepEqual([result.width, result.height], [200, 150])
    assert.equal(result.filename, 'logo-resized.webp')
    assert.equal(result.outputBytes, 400)
    assert.equal(journal.fills, 0)
    assert.deepEqual(journal.draws, [[200, 150]])
    assert.equal(journal.released, 1)
    assert.equal(journal.freed, true)
  })

  test('uses the established white matte for JPEG', async () => {
    const { deps, journal } = makeDeps()
    await resizeImage(
      fakeFile('alpha.png', 'image/png'),
      {
        dimensions: { mode: 'percentage', percentage: 50 },
        outputMimeType: 'image/jpeg',
        quality: 0.8,
      },
      deps,
    )
    assert.equal(journal.fills, 1)
  })

  test('meets an achievable target with bounded quality attempts', async () => {
    const { deps, journal } = makeDeps({ sizes: [900, 400, 300, 200, 100] })
    const result = await resizeImage(
      fakeFile('photo.jpg', 'image/jpeg'),
      {
        dimensions: { mode: 'exact', width: 200 },
        outputMimeType: 'image/jpeg',
        quality: 0.9,
        targetBytes: 500,
      },
      deps,
    )
    assert.equal(result.targetMet, true)
    assert.ok(result.attempts <= 7)
    assert.ok(journal.encodes <= 7)
  })

  test('does not pretend PNG quality can meet a target', async () => {
    const { deps } = makeDeps({ sizes: [900] })
    await assert.rejects(
      resizeImage(
        fakeFile('photo.png', 'image/png'),
        {
          dimensions: { mode: 'exact', width: 200 },
          outputMimeType: 'image/png',
          quality: 0.9,
          targetBytes: 500,
        },
        deps,
      ),
      /PNG quality cannot be adjusted/,
    )
  })

  test('does not change the original dimensions', async () => {
    const { deps } = makeDeps({ width: 640, height: 480 })
    const result = await resizeImage(
      fakeFile('photo.jpg', 'image/jpeg'),
      {
        dimensions: { mode: 'fit', width: 100, height: 100 },
        outputMimeType: 'image/jpeg',
        quality: 0.9,
      },
      deps,
    )
    assert.equal(result.originalWidth, 640)
    assert.equal(result.originalHeight, 480)
    assert.equal(IMAGE_FORMATS.length, 3)
  })
})
