import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

const component = readFileSync(new URL('./ImageConverter.tsx', import.meta.url), 'utf8')
const dropzone = readFileSync(new URL('./ConverterDropzone.tsx', import.meta.url), 'utf8')
const content = readFileSync(new URL('./content.tsx', import.meta.url), 'utf8')

describe('Image Converter single-file workflow', () => {
  test('uses the established drag, picker, validation, and same-file reselection pattern', () => {
    assert.match(dropzone, /event\.dataTransfer\.files\?\.\[0\]/)
    assert.match(dropzone, /type="file"/)
    assert.doesNotMatch(dropzone, /multiple/)
    assert.match(dropzone, /ACCEPTED_MIME_TYPES/)
    assert.match(dropzone, /ACCEPTED_EXTENSIONS/)
    assert.match(dropzone, /event\.target\.value = ''/)
    assert.match(dropzone, /role="alert"/)
  })

  test('derives output choices from the shared capability model', () => {
    assert.match(component, /IMAGE_FORMATS\.map/)
    assert.match(component, /value=\{format\.mimeType\}/)
    assert.match(component, /validateFile\(next, VALIDATION_RULES\)/)
    assert.match(component, /resolveInputFormat\(next\)/)
  })

  test('has an accessible explicit conversion and download workflow', () => {
    assert.match(component, /htmlFor="converter-output"/)
    assert.match(component, /id="converter-output"/)
    assert.match(component, /aria-live="polite"/)
    assert.match(component, /role="alert"/)
    assert.match(component, /downloadBlob\(result\.blob, result\.filename\)/)
    assert.match(component, /runId\.current/)
  })

  test('keeps the privacy and format-limit claims accurate', () => {
    assert.match(dropzone, /never uploaded to a server/)
    assert.match(content, /Only JPG, PNG, and WebP are supported/)
    assert.match(content, /HEIC is not listed/)
    assert.match(content, /never crops, rotates,\s+stretches, or silently resizes/)
  })

  test('does not introduce batch, queue, or archive behavior', () => {
    const source = `${component}\n${dropzone}`
    assert.doesNotMatch(source, /\bzip\b/i)
    assert.doesNotMatch(source, /\bbatch\b/i)
    assert.doesNotMatch(source, /\bqueue\b/i)
    assert.doesNotMatch(source, /FileList/)
  })
})
