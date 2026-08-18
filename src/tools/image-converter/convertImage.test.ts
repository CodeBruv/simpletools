import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  IMAGE_FORMATS,
  ImageConversionError,
  MAX_PIXELS,
  convertImage,
  defaultOutputFor,
  resolveInputFormat,
} from '@/tools/image-converter/convertImage'
import type {
  CanvasLike,
  ConvertImageDeps,
  ImageFormatCapability,
} from '@/tools/image-converter/convertImage'

function fakeFile(name: string, type: string, size = 320): File {
  return { name, type, size } as File
}

interface Journal {
  canvasSize: [number, number] | null
  encodedMime: string | undefined
  encodedQuality: number | undefined
  fills: Array<[number, number, number, number]>
  draws: Array<[number, number, number, number]>
  released: number
  freed: boolean
}

interface FakeOptions {
  width?: number
  height?: number
  outputType?: string
  outputSize?: number
  nullBlob?: boolean
  noContext?: boolean
  decodeError?: Error
}

function makeDeps(options: FakeOptions = {}): { deps: ConvertImageDeps; journal: Journal } {
  const journal: Journal = {
    canvasSize: null,
    encodedMime: undefined,
    encodedQuality: undefined,
    fills: [],
    draws: [],
    released: 0,
    freed: false,
  }

  const deps: ConvertImageDeps = {
    async decode() {
      if (options.decodeError) throw options.decodeError
      return {
        source: {} as CanvasImageSource,
        width: options.width ?? 640,
        height: options.height ?? 480,
        release: () => {
          journal.released += 1
        },
      }
    },
    createCanvas(width, height) {
      journal.canvasSize = [width, height]
      let canvasWidth = width
      let canvasHeight = height
      const canvas: CanvasLike = {
        get width() {
          return canvasWidth
        },
        set width(value) {
          canvasWidth = value
          if (value === 0 && canvasHeight === 0) journal.freed = true
        },
        get height() {
          return canvasHeight
        },
        set height(value) {
          canvasHeight = value
          if (value === 0 && canvasWidth === 0) journal.freed = true
        },
        getContext() {
          if (options.noContext) return null
          return {
            fillStyle: '',
            imageSmoothingEnabled: false,
            imageSmoothingQuality: 'low',
            fillRect(x, y, w, h) {
              journal.fills.push([x, y, w, h])
            },
            drawImage(_source, x, y, w, h) {
              journal.draws.push([x, y, w, h])
            },
          }
        },
        toBlob(callback, type, quality) {
          journal.encodedMime = type
          journal.encodedQuality = quality
          if (options.nullBlob) {
            callback(null)
            return
          }
          callback({
            type: options.outputType ?? type ?? '',
            size: options.outputSize ?? 210,
          } as Blob)
        },
      }
      return canvas
    },
  }

  return { deps, journal }
}

function extensionFor(format: ImageFormatCapability): string {
  return format.inputExtensions[0]
}

describe('image converter capability model', () => {
  test('defines exactly the formats the browser implementation supports', () => {
    assert.deepEqual(IMAGE_FORMATS.map((format) => format.id), ['jpeg', 'png', 'webp'])
    assert.equal(IMAGE_FORMATS.some((format) => format.id === ('heic' as never)), false)
  })

  test('resolves MIME types and extension fallback from the same model', () => {
    assert.equal(resolveInputFormat(fakeFile('photo.bin', 'image/jpeg'))?.id, 'jpeg')
    assert.equal(resolveInputFormat(fakeFile('photo.PNG', ''))?.id, 'png')
    assert.equal(resolveInputFormat(fakeFile('photo.heic', 'image/heic')), undefined)
  })

  test('picks a genuinely different default output', () => {
    const [jpeg, png, webp] = IMAGE_FORMATS
    assert.equal(defaultOutputFor(jpeg).id, 'png')
    assert.equal(defaultOutputFor(png).id, 'webp')
    assert.equal(defaultOutputFor(webp).id, 'png')
  })
})

describe('convertImage supported paths', () => {
  for (const input of IMAGE_FORMATS) {
    for (const output of IMAGE_FORMATS) {
      test(`${input.label} to ${output.label} is correctly typed, named, and dimension preserving`, async () => {
        const { deps, journal } = makeDeps()
        const file = fakeFile(`holiday.${extensionFor(input)}`, input.mimeType)
        const result = await convertImage(file, output.mimeType, deps)

        assert.equal(result.inputFormat.id, input.id)
        assert.equal(result.outputFormat.id, output.id)
        assert.equal(result.mimeType, output.mimeType)
        assert.equal(result.blob.type, output.mimeType)
        assert.equal(result.filename, `holiday-converted.${output.extension}`)
        assert.deepEqual([result.width, result.height], [640, 480])
        assert.deepEqual(journal.canvasSize, [640, 480])
        assert.deepEqual(journal.draws, [[0, 0, 640, 480]])
        assert.equal(journal.encodedMime, output.mimeType)
      })
    }
  }

  test('uses a white matte only when the destination cannot store transparency', async () => {
    const jpeg = IMAGE_FORMATS[0]
    const png = IMAGE_FORMATS[1]
    const webp = IMAGE_FORMATS[2]

    const jpegRun = makeDeps()
    await convertImage(fakeFile('alpha.png', png.mimeType), jpeg.mimeType, jpegRun.deps)
    assert.deepEqual(jpegRun.journal.fills, [[0, 0, 640, 480]])

    for (const output of [png, webp]) {
      const run = makeDeps()
      await convertImage(fakeFile('alpha.png', png.mimeType), output.mimeType, run.deps)
      assert.deepEqual(run.journal.fills, [])
    }
  })
})

describe('convertImage failures and cleanup', () => {
  test('rejects unsupported inputs before decoding', async () => {
    const { deps, journal } = makeDeps()
    await assert.rejects(
      convertImage(fakeFile('camera.heic', 'image/heic'), 'image/png', deps),
      (error: unknown) => error instanceof ImageConversionError && /JPG, PNG, WebP/.test(error.message),
    )
    assert.equal(journal.released, 0)
  })

  test('turns a corrupt-image decode failure into an understandable error', async () => {
    const { deps } = makeDeps({ decodeError: new Error('decoder exploded') })
    await assert.rejects(
      convertImage(fakeFile('broken.png', 'image/png'), 'image/webp', deps),
      (error: unknown) => error instanceof ImageConversionError && /couldn't be decoded/.test(error.message),
    )
  })

  test('rejects dimensions over the pixel budget instead of resizing', async () => {
    const { deps, journal } = makeDeps({ width: MAX_PIXELS + 1, height: 1 })
    await assert.rejects(
      convertImage(fakeFile('wide.jpg', 'image/jpeg'), 'image/png', deps),
      (error: unknown) => error instanceof ImageConversionError && /dimensions were not changed/.test(error.message),
    )
    assert.equal(journal.canvasSize, null)
    assert.equal(journal.released, 1)
  })

  test('rejects a browser encoder fallback rather than misnaming it', async () => {
    const { deps, journal } = makeDeps({ outputType: 'image/png' })
    await assert.rejects(
      convertImage(fakeFile('photo.png', 'image/png'), 'image/webp', deps),
      (error: unknown) => error instanceof ImageConversionError && /cannot create WebP/.test(error.message),
    )
    assert.equal(journal.released, 1)
    assert.equal(journal.freed, true)
  })

  test('reports a null encoder result and cleans decoded pixels and canvas', async () => {
    const { deps, journal } = makeDeps({ nullBlob: true })
    await assert.rejects(
      convertImage(fakeFile('photo.jpg', 'image/jpeg'), 'image/png', deps),
      (error: unknown) => error instanceof ImageConversionError && /could not encode/.test(error.message),
    )
    assert.equal(journal.released, 1)
    assert.equal(journal.freed, true)
  })

  test('cleans decoded pixels and canvas after success', async () => {
    const { deps, journal } = makeDeps()
    await convertImage(fakeFile('photo.jpg', 'image/jpeg'), 'image/png', deps)
    assert.equal(journal.released, 1)
    assert.equal(journal.freed, true)
  })

  test('cleans decoded pixels when canvas access fails', async () => {
    const { deps, journal } = makeDeps({ noContext: true })
    await assert.rejects(
      convertImage(fakeFile('photo.jpg', 'image/jpeg'), 'image/png', deps),
      (error: unknown) => error instanceof ImageConversionError && /canvas access/.test(error.message),
    )
    assert.equal(journal.released, 1)
    assert.equal(journal.freed, true)
  })
})
