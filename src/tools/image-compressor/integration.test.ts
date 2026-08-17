import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = fileURLToPath(new URL('../../..', import.meta.url))

function readProjectFile(relativePath: string): string {
  return readFileSync(join(PROJECT_ROOT, relativePath), 'utf8')
}

const COMPRESSOR = readProjectFile('src/tools/image-compressor/ImageCompressor.tsx')
const DROPZONE = readProjectFile('src/tools/image-compressor/Dropzone.tsx')

describe('responsive completion flow', () => {
  test('the DOM presents the actionable result workflow before the comparison', () => {
    const resultPanel = COMPRESSOR.indexOf('lg:col-start-2')
    const comparison = COMPRESSOR.indexOf('<ComparePreview')

    assert.ok(resultPanel > -1)
    assert.ok(comparison > resultPanel)
    assert.equal(COMPRESSOR.match(/<ComparePreview\b/g)?.length, 1)
    assert.equal(COMPRESSOR.match(/<ResultLedger\b/g)?.length, 1)
  })

  test('large screens retain comparison-left and controls-right placement', () => {
    assert.match(COMPRESSOR, /lg:grid-cols-\[minmax\(0,1fr\)_340px\] lg:items-start/)
    assert.match(COMPRESSOR, /bg-surface p-5 sm:p-6 lg:col-start-2/)
    assert.match(
      COMPRESSOR,
      /className="min-w-0 lg:col-start-1 lg:row-start-1"[\s\S]*<ComparePreview/,
    )
  })

  test('the selected filename remains visible while processing or after an error', () => {
    assert.match(
      COMPRESSOR,
      /processError \? \([\s\S]*title=\{file\.name\}[\s\S]*That didn't work/,
    )
    assert.match(
      COMPRESSOR,
      /result \? \([\s\S]*<ResultLedger result=\{result\} filename=\{file\.name\}[\s\S]*title=\{file\.name\}[\s\S]*Compressing/,
    )
  })

  test('download, reset, quality, busy, and error behavior stay in the result panel', () => {
    assert.match(COMPRESSOR, /<QualitySlider value=\{quality\} onChange=\{setQuality\}/)
    assert.match(COMPRESSOR, /disabled=\{!result \|\| busy\}/)
    assert.match(COMPRESSOR, /downloadBlob\(result\.blob, result\.filename\)/)
    assert.match(COMPRESSOR, /onClick=\{reset\}[\s\S]*Compress another image/)
    assert.match(COMPRESSOR, /failed=\{Boolean\(processError\)\}/)
  })
})

describe('the upload surface is unchanged by the completion-flow adjustment', () => {
  test('mobile and desktop padding, accepted files, and same-file reselection remain intact', () => {
    assert.match(DROPZONE, /px-5 py-10 text-center sm:px-8 sm:py-16/)
    assert.match(DROPZONE, /accept=\{\[\.\.\.ACCEPTED_MIME_TYPES, \.\.\.ACCEPTED_EXTENSIONS/)
    assert.match(DROPZONE, /event\.target\.value = ''/)
    assert.match(DROPZONE, /onDrop=\{handleDrop\}/)
  })
})
