import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = fileURLToPath(new URL('../../..', import.meta.url))

function readProjectFile(relativePath: string): string {
  return readFileSync(join(PROJECT_ROOT, relativePath), 'utf8')
}

const COMPRESSOR = readProjectFile('src/tools/pdf-compressor/PdfCompressor.tsx')

describe('responsive PDF completion flow', () => {
  test('the DOM presents the result workflow before the controls', () => {
    const resultPanel = COMPRESSOR.indexOf('lg:col-start-2')
    const controls = COMPRESSOR.indexOf('<ModeSelector')

    assert.ok(resultPanel > -1)
    assert.ok(controls > resultPanel)
    assert.equal(COMPRESSOR.match(/<PdfResultLedger\b/g)?.length, 1)
  })

  test('large screens retain controls-left and result-right placement', () => {
    assert.match(COMPRESSOR, /grid gap-8 lg:grid-cols-\[minmax\(0,1fr\)_340px\] lg:items-start/)
    assert.match(COMPRESSOR, /bg-surface p-5 sm:p-6 lg:col-start-2[\s\S]*<PdfResultLedger/)
    assert.match(
      COMPRESSOR,
      /bg-surface p-5 sm:p-6 lg:col-start-1 lg:row-start-1[\s\S]*<ModeSelector/,
    )
  })

  test('keeps one polite live region and one result panel', () => {
    assert.equal(COMPRESSOR.match(/aria-live="polite"/g)?.length, 1)
    assert.equal(COMPRESSOR.match(/<PdfResultLedger\b/g)?.length, 1)
  })

  test('progress, download, reset, and mode-triggered processing wiring remain intact', () => {
    assert.match(COMPRESSOR, /onProgress: \(done, total\)[\s\S]*setProgress\(\{ done, total \}\)/)
    assert.match(COMPRESSOR, /disabled=\{!result \|\| busy\}/)
    assert.match(COMPRESSOR, /downloadBlob\(result\.blob, result\.filename\)/)
    assert.match(COMPRESSOR, /onClick=\{reset\}[\s\S]*Compress another PDF/)
    assert.match(
      COMPRESSOR,
      /function changeMode\(next: CompressionMode\)[\s\S]*setMode\(next\)[\s\S]*run\(file, next, quality\)/,
    )
  })
})
