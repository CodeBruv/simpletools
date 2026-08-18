import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test, describe } from 'node:test'

const component = readFileSync(new URL('./PdfMerger.tsx', import.meta.url), 'utf8')
const dropzone = readFileSync(new URL('./MergerDropzone.tsx', import.meta.url), 'utf8')
const fileList = readFileSync(new URL('./PdfFileList.tsx', import.meta.url), 'utf8')

 describe('PDF merger interaction contract', () => {
  test('accepts multiple PDFs and supports incremental additions', () => {
    assert.match(dropzone, /type="file"/)
    assert.match(dropzone, /multiple/)
    assert.match(dropzone, /onFiles\(Array\.from/)
    assert.match(component, /<MergerDropzone onFiles=\{addFiles\} error=\{inputError\}/)
    assert.match(component, /compact \/>/)
  })

  test('renders an ordered file list with accessible reorder and remove controls', () => {
    assert.match(fileList, /<ol[^>]+aria-label="PDF merge order"/)
    assert.match(fileList, /Move \$\{item\.file\.name\} up/)
    assert.match(fileList, /Move \$\{item\.file\.name\} down/)
    assert.match(fileList, /Remove \$\{item\.file\.name\}/)
    assert.match(component, /onMove=\{moveFile\}/)
    assert.match(component, /onRemove=\{removeFile\}/)
  })

  test('keeps Merge disabled until two files are selected and wires displayed order', () => {
    assert.match(component, /files\.length < 2 \|\| busy \|\| Boolean\(result\)/)
    assert.match(component, /files\.map\(\(item\) => item\.file\)/)
    assert.match(component, /mergePdfs\(/)
  })

  test('announces progress, errors, and completion in one polite live region', () => {
    assert.match(component, /aria-live="polite"/)
    assert.match(component, /Merging file \$\{progress\.done\} of \$\{progress\.total\}/)
    assert.match(component, /role="alert"/)
    assert.match(component, /Merged \$\{result\.fileCount\} files into \$\{result\.pageCount\} pages/)
  })

  test('wires local download and reset actions', () => {
    assert.match(component, /downloadBlob\(result\.blob, result\.filename\)/)
    assert.match(component, /onClick=\{reset\}/)
    assert.match(component, /Merge another set/)
  })

  test('uses the existing shell and keeps the merger content responsive', () => {
    assert.match(component, /<ToolShell tool=\{tool\} help=\{HELP\} faq=\{FAQ\}>/)
    assert.match(component, /lg:grid-cols-\[minmax\(0,1fr\)_340px\]/)
    assert.match(component, /lg:col-start-1/)
    assert.match(component, /lg:col-start-2/)
  })
})
