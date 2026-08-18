export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128

export const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/<>~',
} as const

export type CharacterSetKey = keyof typeof CHARACTER_SETS

export interface PasswordOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
  excludeAmbiguous: boolean
}

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
}

export class PasswordGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PasswordGenerationError'
  }
}

const AMBIGUOUS_CHARACTERS = new Set(['0', 'O', 'o', '1', 'l', 'I'])

function getRandomValues(): Crypto['getRandomValues'] {
  if (typeof globalThis.crypto?.getRandomValues !== 'function') {
    throw new PasswordGenerationError('Secure browser randomness is unavailable in this environment.')
  }
  return globalThis.crypto.getRandomValues.bind(globalThis.crypto)
}

/** Rejection sampling avoids modulo bias when mapping random bytes to indices. */
function secureIndex(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1) {
    throw new PasswordGenerationError('The character pool is empty.')
  }

  const randomValues = getRandomValues()
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive
  const value = new Uint32Array(1)

  do {
    randomValues(value)
  } while (value[0]! >= limit)

  return value[0]! % maxExclusive
}

function filteredSet(set: string, excludeAmbiguous: boolean): string {
  if (!excludeAmbiguous) return set
  return [...set].filter((character) => !AMBIGUOUS_CHARACTERS.has(character)).join('')
}

function selectedSets(options: PasswordOptions): Array<{ key: CharacterSetKey; characters: string }> {
  return (Object.keys(CHARACTER_SETS) as CharacterSetKey[])
    .filter((key) => options[key])
    .map((key) => ({ key, characters: filteredSet(CHARACTER_SETS[key], options.excludeAmbiguous) }))
}

function validateOptions(options: PasswordOptions, sets: Array<{ key: CharacterSetKey; characters: string }>): void {
  if (sets.length === 0) {
    throw new PasswordGenerationError('Select at least one character type.')
  }
  if (options.length < sets.length) {
    throw new PasswordGenerationError(`Password length must be at least ${sets.length}, the number of selected character types.`)
  }
  if (!Number.isInteger(options.length) || options.length < MIN_PASSWORD_LENGTH || options.length > MAX_PASSWORD_LENGTH) {
    throw new PasswordGenerationError(`Password length must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`)
  }
  if (sets.some((set) => set.characters.length === 0)) {
    throw new PasswordGenerationError('The selected character options leave an empty character set.')
  }
}

function randomCharacter(characters: string): string {
  return characters[secureIndex(characters.length)]!
}

export function generatePassword(options: PasswordOptions): string {
  const sets = selectedSets(options)
  validateOptions(options, sets)

  const pool = sets.map((set) => set.characters).join('')
  const password = sets.map((set) => randomCharacter(set.characters))

  while (password.length < options.length) password.push(randomCharacter(pool))

  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = secureIndex(index + 1)
    ;[password[index], password[swapIndex]] = [password[swapIndex]!, password[index]!]
  }

  return password.join('')
}

export function getCharacterPool(options: PasswordOptions): string {
  return selectedSets(options).map((set) => set.characters).join('')
}
