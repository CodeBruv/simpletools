import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

const component = readFileSync(new URL('./ImageResizer.tsx', import.meta.url), 'utf8')
const dropzone = readFileSync(new URL('./ResizerDropzone.tsx', import.meta.url), 'utf8')
const content = readFileSync(new URL('./content.tsx', import.meta.url), 'utf8')
const engine = readFileSync(new URL('./resizeImage.ts', import.meta.url), 'utf8')

describe('Image Resizer single-file workflow', () => {
  test('uses the established drag, picker, validation, and same-file reselection pattern', () => {
    assert.match(dropzone, /event\.dataTransfer\.files\?\.\[0\]/)
    assert.match(dropzone, /type="file"/)
    assert.doesNotMatch(dropzone, /multiple/)
    assert.match(dropzone, /ACCEPTED_MIME_TYPES/)
    assert.match(dropzone, /ACCEPTED_EXTENSIONS/)
    assert.match(dropzone, /event\.target\.value = ''/)
    assert.match(dropzone, /role="alert"/)
  })

  test('exposes accessible resize modes and result actions', () => {
    assert.match(component, /type="radio"/)
    assert.match(component, /Exact dimensions/)
    assert.match(component, /Percentage/)
    assert.match(component, /Fit within/)
    assert.match(component, /type="checkbox"/)
    assert.match(component, /aria-live="polite"/)
    assert.match(component, /role="alert"/)
    assert.match(component, /downloadBlob\(result\.blob, result\.filename\)/)
    assert.match(component, /runId\.current/)
  })

  test('keeps dimensions fixed while target-size mode changes quality only', () => {
    assert.match(component, /targetBytes: targetEnabled \? Number\(targetKb\) \* 1024 : undefined/)
    assert.match(component, /at most seven encoding attempts/)
    assert.match(engine, /MAX_ENCODE_ATTEMPTS = 7/)
    assert.match(engine, /requested dimensions/)
  })

  test('keeps privacy, transparency, and format claims accurate', () => {
    assert.match(dropzone, /never uploaded to a server/)
    assert.match(content, /JPG, PNG, and WebP are supported as inputs and outputs/)
    assert.match(content, /HEIC is not claimed/)
    assert.match(content, /white background/)
    assert.match(content, /not sent to a server or stored/)
  })

  test('does not introduce batch, queue, or archive behavior', () => {
    const source = `${component}\n${dropzone}`
    assert.doesNotMatch(source, /\bzip\b/i)
    assert.doesNotMatch(source, /\bbatch\b/i)
    assert.doesNotMatch(source, /\bqueue\b/i)
    assert.doesNotMatch(source, /FileList/)
  })
})
