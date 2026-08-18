import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'

import {
  CHARACTER_SETS,
  DEFAULT_PASSWORD_OPTIONS,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  PasswordGenerationError,
  generatePassword,
  getCharacterPool,
} from '@/tools/password-generator/generatePassword'

const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, 'crypto')

afterEach(() => {
  if (originalCrypto) Object.defineProperty(globalThis, 'crypto', originalCrypto)
})

function installDeterministicCrypto(): void {
  let value = 0
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      getRandomValues<T extends ArrayBufferView>(array: T): T {
        const values = new Uint32Array(array.buffer, array.byteOffset, Math.floor(array.byteLength / 4))
        for (let index = 0; index < values.length; index += 1) values[index] = value++
        return array
      },
    },
  })
}

describe('generatePassword', () => {
  test('uses a strong default configuration', () => {
    assert.deepEqual(DEFAULT_PASSWORD_OPTIONS, {
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: false,
    })
  })

  test('generates an exact requested length using secure browser randomness', () => {
    installDeterministicCrypto()
    const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 24 })

    assert.equal(typeof password, 'string')
    assert.equal(password.length, 24)
  })

  test('supports both minimum and maximum lengths', () => {
    installDeterministicCrypto()
    assert.equal(generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: MIN_PASSWORD_LENGTH }).length, MIN_PASSWORD_LENGTH)
    assert.equal(generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: MAX_PASSWORD_LENGTH }).length, MAX_PASSWORD_LENGTH)
  })

  test('requires every enabled character type to appear', () => {
    installDeterministicCrypto()
    const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 20 })

    assert.match(password, /[A-Z]/)
    assert.match(password, /[a-z]/)
    assert.match(password, /[0-9]/)
    assert.ok([...password].some((character) => CHARACTER_SETS.symbols.includes(character)))
  })

  test('supports individual character types and combinations', () => {
    installDeterministicCrypto()
    const uppercaseOnly = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 12, lowercase: false, numbers: false, symbols: false })
    const lettersAndNumbers = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 12, symbols: false })

    assert.match(uppercaseOnly, /^[A-Z]+$/)
    assert.match(lettersAndNumbers, /^[A-Za-z0-9]+$/)
    assert.match(lettersAndNumbers, /[A-Z]/)
    assert.match(lettersAndNumbers, /[a-z]/)
    assert.match(lettersAndNumbers, /[0-9]/)
  })

  test('never returns characters outside the selected pool', () => {
    installDeterministicCrypto()
    const options = { ...DEFAULT_PASSWORD_OPTIONS, length: 40, uppercase: false, symbols: false }
    const password = generatePassword(options)
    const pool = getCharacterPool(options)

    assert.ok([...password].every((character) => pool.includes(character)))
  })

  test('excludes visually ambiguous characters when requested', () => {
    installDeterministicCrypto()
    const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 64, excludeAmbiguous: true })

    assert.doesNotMatch(password, /[0Oo1lI]/)
  })

  test('rejects invalid lengths and invalid character selections', () => {
    installDeterministicCrypto()

    for (const length of [MIN_PASSWORD_LENGTH - 1, MAX_PASSWORD_LENGTH + 1, 12.5]) {
      assert.throws(() => generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length }), PasswordGenerationError)
    }
    assert.throws(
      () => generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, uppercase: false, lowercase: false, numbers: false, symbols: false }),
      /Select at least one character type/,
    )
  })

  test('reports unavailable Web Crypto without generating a fallback password', () => {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: undefined })

    assert.throws(() => generatePassword(DEFAULT_PASSWORD_OPTIONS), /Secure browser randomness is unavailable/)
  })

  test('uses only the defined character set sources', () => {
    assert.equal(CHARACTER_SETS.uppercase, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    assert.equal(CHARACTER_SETS.lowercase, 'abcdefghijklmnopqrstuvwxyz')
    assert.equal(CHARACTER_SETS.numbers, '0123456789')
  })
})
