import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  describeJsonError,
  formatJsonError,
  processJson,
} from '@/tools/json-formatter/formatJson'

const VALID_VALUES = [
  '{}',
  '[]',
  'null',
  'true',
  '123',
  '"hello"',
  '{"items":[{"active":true},null,3.5]}',
  '["one",["two",{"three":3}]]',
  '{"text":"Olá 👋 世界","escaped":"line\\nquote: \\""}',
] as const

const INVALID_VALUES = [
  '{"name":"SimpleTools",}',
  '{"one":1 "two":2}',
  '{"open":true',
  '[1,2',
  '{name:"SimpleTools"}',
  "{'name':'SimpleTools'}",
  '{"text":"unterminated}',
  '{"escape":"\\x"}',
  '{"number":01}',
] as const

describe('JSON formatting', () => {
  test('accepts every JSON value type and preserves its parsed meaning', () => {
    for (const input of VALID_VALUES) {
      const result = processJson(input, 'format')
      assert.equal(result.ok, true, input)
      assert.notEqual(result.output, undefined, input)
      assert.deepEqual(JSON.parse(result.output!), JSON.parse(input), input)
    }
  })

  test('formats with 2 spaces, 4 spaces, and tabs', () => {
    const input = '{"nested":{"active":true}}'

    assert.match(processJson(input, 'format', 2).output!, /\n {2}"nested"/)
    assert.match(processJson(input, 'format', 4).output!, /\n {4}"nested"/)
    assert.match(processJson(input, 'format', '\t').output!, /\n\t"nested"/)
  })

  test('does not reorder object keys', () => {
    const result = processJson('{"z":1,"a":2,"m":3}', 'format')
    const output = result.output ?? ''
    assert.equal(output.indexOf('"z"') < output.indexOf('"a"'), true)
    assert.equal(output.indexOf('"a"') < output.indexOf('"m"'), true)
  })
})

describe('JSON minification', () => {
  test('removes formatting whitespace and preserves semantic data', () => {
    const input = '{\n  "name": "SimpleTools",\n  "items": [true, null, "hello"]\n}'
    const result = processJson(input, 'minify')

    assert.equal(result.ok, true)
    assert.equal(result.output, '{"name":"SimpleTools","items":[true,null,"hello"]}')
    assert.deepEqual(JSON.parse(result.output!), JSON.parse(input))
  })
})

describe('JSON validation and errors', () => {
  test('validates without creating output', () => {
    for (const input of VALID_VALUES) {
      assert.deepEqual(processJson(input, 'validate'), { ok: true })
    }
  })

  test('rejects empty input with a useful stable message', () => {
    assert.deepEqual(processJson('   \n', 'validate'), {
      ok: false,
      error: { message: 'Enter JSON to process.' },
    })
  })

  test('rejects representative invalid JSON without throwing', () => {
    for (const input of INVALID_VALUES) {
      const result = processJson(input, 'validate')
      assert.equal(result.ok, false, input)
      assert.ok(result.error?.message, input)
    }
  })

  test('extracts a parser position when the engine exposes one', () => {
    const error = describeJsonError(new SyntaxError('Unexpected token } in JSON at position 42'))
    assert.equal(error.position, 42)
    assert.match(formatJsonError(error), /Near position 42\./)
  })

  test('extracts line and column when the engine exposes them', () => {
    const error = describeJsonError(new SyntaxError('Expected value at line 4 column 18'))
    assert.equal(error.line, 4)
    assert.equal(error.column, 18)
    assert.match(formatJsonError(error), /Line 4, column 18\./)
  })

  test('does not fabricate a location when none is available', () => {
    const error = describeJsonError(new SyntaxError('Unexpected end of JSON input'))
    assert.equal(error.position, undefined)
    assert.equal(error.line, undefined)
    assert.equal(error.column, undefined)
    assert.equal(formatJsonError(error), 'Unexpected end of JSON input')
  })
})
