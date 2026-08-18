import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

const component = readFileSync(new URL('./PasswordGenerator.tsx', import.meta.url), 'utf8')
const engine = readFileSync(new URL('./generatePassword.ts', import.meta.url), 'utf8')
const content = readFileSync(new URL('./content.tsx', import.meta.url), 'utf8')

describe('Password Generator local workflow', () => {
  test('uses labelled native controls and a selectable read-only result', () => {
    assert.match(component, /htmlFor="generated-password"/)
    assert.match(component, /id="generated-password"/)
    assert.match(component, /readOnly/)
    assert.match(component, /select-text/)
    assert.match(component, /id="password-length-range"/)
    assert.match(component, /id="password-length"/)
    assert.match(component, /type="checkbox"/)
  })

  test('offers explicit generate, copy, and reset actions with complete reset state', () => {
    assert.match(component, /onClick=\{generate\}/)
    assert.match(component, /navigator\.clipboard\.writeText\(password\)/)
    assert.match(component, /void copyPassword\(\)/)
    assert.match(component, /onClick=\{reset\}/)
    assert.match(component, /setOptions\(\{ \.\.\.DEFAULT_PASSWORD_OPTIONS \}\)/)
    assert.match(component, /setPassword\(''\)/)
    assert.match(component, /setCopyState\('idle'\)/)
  })

  test('announces status and errors without discarding a password on copy failure', () => {
    assert.match(component, /aria-live="polite"/)
    assert.match(component, /role=\{error \? 'alert' : 'status'\}/)
    assert.match(component, /Unable to copy automatically/)
    assert.doesNotMatch(component, /catch \{[^}]*setPassword\(''\)/s)
  })

  test('uses Web Crypto with rejection sampling and no insecure randomness', () => {
    assert.match(engine, /crypto\?\.getRandomValues/)
    assert.match(engine, /Math\.floor\(0x100000000 \/ maxExclusive\) \* maxExclusive/)
    assert.match(engine, /while \(value\[0\]! >= limit\)/)
    assert.match(engine, /for \(let index = password\.length - 1; index > 0; index -= 1\)/)
    assert.doesNotMatch(`${component}\n${engine}`, /Math\.random|fetch\(|XMLHttpRequest/)
  })

  test('does not persist or expose generated passwords', () => {
    const source = `${component}\n${engine}`
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie|URLSearchParams/)
    assert.doesNotMatch(source, /console\.|fetch\(|XMLHttpRequest/)
  })

  test('uses ToolShell content and accurate local privacy claims', () => {
    assert.match(component, /<ToolShell tool=\{tool\} help=\{HELP\} faq=\{FAQ\}>/)
    assert.match(component, /not uploaded or stored by SimpleTools/)
    assert.match(content, /browser's Web Crypto API/)
    assert.match(content, /not uploaded/)
    assert.match(content, /different password for every account/)
    assert.match(content, /organization/)
  })
})
