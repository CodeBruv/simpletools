import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

const component = readFileSync(new URL('./JsonFormatter.tsx', import.meta.url), 'utf8')
const engine = readFileSync(new URL('./formatJson.ts', import.meta.url), 'utf8')
const content = readFileSync(new URL('./content.tsx', import.meta.url), 'utf8')

describe('JSON Formatter explicit local workflow', () => {
  test('uses labelled native textareas with a separate read-only result', () => {
    assert.match(component, /htmlFor="json-input"/)
    assert.match(component, /id="json-input"/)
    assert.match(component, /<textarea/)
    assert.match(component, /htmlFor="json-output"/)
    assert.match(component, /id="json-output"/)
    assert.match(component, /readOnly/)
    assert.match(component, /placeholder=\{EXAMPLE\}/)
  })

  test('processes only through explicit format, minify, and validate actions', () => {
    assert.match(component, /onClick=\{\(\) => run\('format'\)\}/)
    assert.match(component, /onClick=\{\(\) => run\('minify'\)\}/)
    assert.match(component, /onClick=\{\(\) => run\('validate'\)\}/)
    assert.doesNotMatch(component, /useEffect/)
    assert.doesNotMatch(component, /onChange=\{[^}]*processJson/)
  })

  test('uses native JSON parsing and serialization without an editor framework', () => {
    assert.match(engine, /JSON\.parse\(input\)/)
    assert.match(engine, /JSON\.stringify/)
    const source = `${component}\n${engine}`
    assert.doesNotMatch(source, /monaco|codemirror|ace-editor|highlight\.js|prism/i)
    assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|localStorage|sessionStorage/)
  })

  test('exposes clear disabled states and a complete reset path', () => {
    assert.match(component, /disabled=\{!hasInput\}/)
    assert.match(component, /disabled=\{!hasOutput\}/)
    assert.match(component, /disabled=\{!hasInput && !hasOutput\}/)
    assert.match(component, /setInput\(''\)/)
    assert.match(component, /setOutput\(''\)/)
    assert.match(component, /setStatus\(''\)/)
    assert.match(component, /setError\(''\)/)
  })

  test('announces success and errors accessibly', () => {
    assert.match(component, /aria-live="polite"/)
    assert.match(component, /role=\{error \? 'alert' : 'status'\}/)
    assert.match(component, /Valid JSON/)
    assert.match(component, /Unable to copy automatically/)
  })

  test('uses native clipboard and the shared JSON download helper', () => {
    assert.match(component, /navigator\.clipboard\.writeText\(output\)/)
    assert.match(component, /downloadBlob\(new Blob\(\[output\], \{ type: 'application\/json;charset=utf-8' \}\), 'formatted\.json'\)/)
    assert.match(component, /Copy/)
    assert.match(component, /Download JSON/)
  })

  test('uses ToolShell content and makes accurate local-processing claims', () => {
    assert.match(component, /<ToolShell tool=\{tool\} help=\{HELP\} faq=\{FAQ\}>/)
    assert.match(content, /Objects, arrays, strings, numbers, booleans, and null/)
    assert.match(content, /happen in your browser/)
    assert.match(content, /standard JavaScript JSON parsing semantics/)
  })
})
