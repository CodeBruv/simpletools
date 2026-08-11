import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildOutputFilename,
  formatBytes,
  formatPercent,
  getExtension,
  reductionPercent,
  stripExtension,
  validateFile,
} from '@/lib/file'

/** A File with a controlled size, without allocating the bytes. */
function fakeFile(name: string, type: string, size: number): File {
  const file = new File([], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

const IMAGE_RULES = {
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  acceptedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  maxBytes: 25 * 1024 * 1024,
  acceptedLabel: 'JPG, PNG and WebP',
}

describe('formatBytes', () => {
  test('uses bytes below one kilobyte', () => {
    assert.equal(formatBytes(0), '0 B')
    assert.equal(formatBytes(1), '1 B')
    assert.equal(formatBytes(1023), '1023 B')
  })

  test('matches the sizes the UI advertises', () => {
    assert.equal(formatBytes(4.2 * 1024 * 1024), '4.2 MB')
    assert.equal(formatBytes(1.1 * 1024 * 1024), '1.1 MB')
    assert.equal(formatBytes(1024), '1.0 KB')
  })

  test('honours an explicit precision', () => {
    assert.equal(formatBytes(25 * 1024 * 1024, 0), '25 MB')
  })

  test('refuses to invent a number for nonsense input', () => {
    assert.equal(formatBytes(Number.NaN), '—')
    assert.equal(formatBytes(-1), '—')
    assert.equal(formatBytes(Number.POSITIVE_INFINITY), '—')
  })
})

describe('reductionPercent', () => {
  test('reports the saving', () => {
    assert.equal(Math.round(reductionPercent(1000, 250)), 75)
  })

  test('goes negative when the encoder made things worse', () => {
    assert.ok(reductionPercent(1000, 1200) < 0)
  })

  test('is zero rather than Infinity for an empty original', () => {
    assert.equal(reductionPercent(0, 100), 0)
    assert.equal(reductionPercent(Number.NaN, 100), 0)
  })
})

describe('filename helpers', () => {
  test('splits on the final dot only', () => {
    assert.equal(stripExtension('photo.final.JPEG'), 'photo.final')
    assert.equal(getExtension('photo.final.JPEG'), 'jpeg')
  })

  test('treats a missing extension as absent', () => {
    assert.equal(stripExtension('screenshot'), 'screenshot')
    assert.equal(getExtension('screenshot'), '')
  })

  test('does not mistake a dotfile for an extension', () => {
    assert.equal(getExtension('.gitignore'), '')
  })

  test('builds the download name with the real output extension', () => {
    assert.equal(buildOutputFilename('holiday.png', 'webp'), 'holiday-compressed.webp')
    assert.equal(buildOutputFilename('holiday.png', 'jpg'), 'holiday-compressed.jpg')
  })

  test('falls back to a usable name when there is nothing to work with', () => {
    assert.equal(buildOutputFilename('   ', 'webp'), 'file-compressed.webp')
  })
})

describe('formatPercent', () => {
  test('renders one decimal by default', () => {
    assert.equal(formatPercent(73.84), '73.8%')
  })

  test('handles nonsense', () => {
    assert.equal(formatPercent(Number.NaN), '—')
  })
})

describe('validateFile', () => {
  test('accepts each supported type', () => {
    for (const [name, type] of [
      ['a.jpg', 'image/jpeg'],
      ['a.png', 'image/png'],
      ['a.webp', 'image/webp'],
    ] as const) {
      assert.deepEqual(validateFile(fakeFile(name, type, 2048), IMAGE_RULES), { ok: true })
    }
  })

  test('rejects an unsupported type by name and by MIME', () => {
    const result = validateFile(fakeFile('notes.pdf', 'application/pdf', 2048), IMAGE_RULES)
    assert.equal(result.ok, false)
    assert.match(result.ok === false ? result.message : '', /JPG, PNG and WebP/)
  })

  test('accepts a dragged file whose MIME type the browser omitted', () => {
    assert.deepEqual(validateFile(fakeFile('photo.jpg', '', 2048), IMAGE_RULES), { ok: true })
  })

  test('rejects an empty file before anything tries to decode it', () => {
    const result = validateFile(fakeFile('empty.png', 'image/png', 0), IMAGE_RULES)
    assert.equal(result.ok, false)
    assert.match(result.ok === false ? result.message : '', /empty/)
  })

  test('rejects a file over the limit and names both sizes', () => {
    const result = validateFile(
      fakeFile('huge.jpg', 'image/jpeg', 40 * 1024 * 1024),
      IMAGE_RULES,
    )
    assert.equal(result.ok, false)
    const message = result.ok === false ? result.message : ''
    assert.match(message, /40\.0 MB/)
    assert.match(message, /25 MB/)
  })

  test('accepts a file exactly on the limit', () => {
    assert.deepEqual(
      validateFile(fakeFile('edge.jpg', 'image/jpeg', IMAGE_RULES.maxBytes), IMAGE_RULES),
      { ok: true },
    )
  })
})
