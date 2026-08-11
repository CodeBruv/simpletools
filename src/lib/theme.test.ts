import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  DARK_CLASS,
  DEFAULT_THEME_PREFERENCE,
  THEME_OPTIONS,
  THEME_PREFERENCES,
  isThemePreference,
  normaliseThemePreference,
  resolveTheme,
  themeColor,
} from '@/lib/theme'
import type { ThemeStore } from '@/lib/themeStorage'
import {
  THEME_STORAGE_KEY,
  readThemePreference,
  writeThemePreference,
} from '@/lib/themeStorage'

/**
 * A stand-in for localStorage that records everything written to it.
 *
 * The journal is the point: several tests below assert on what did *not* reach
 * storage, which needs a store that remembers every call rather than one that
 * only exposes its final state.
 */
function fakeStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  const writes: Array<{ key: string; value: string }> = []

  const store: ThemeStore = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      writes.push({ key, value })
      data.set(key, value)
    },
  }

  return { store, data, writes }
}

/** Storage that throws on every access, as it does in some privacy modes. */
const hostileStore: ThemeStore = {
  getItem() {
    throw new Error('access denied')
  },
  setItem() {
    throw new Error('access denied')
  },
}

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url))

function readProjectFile(relativePath: string): string {
  return readFileSync(join(PROJECT_ROOT, relativePath), 'utf8')
}

/** Reads one custom property out of a CSS block, so tests cite the real value. */
function cssToken(block: string, name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{3,8})`).exec(block)
  assert.ok(match, `expected --color-${name} to be declared`)
  return match[1]
}

const GLOBALS_CSS = readProjectFile('src/styles/globals.css')

/** The `.dark { … }` block, isolated so light tokens can't satisfy a dark test. */
function darkBlock(): string {
  const start = GLOBALS_CSS.indexOf('.dark {')
  assert.notEqual(start, -1, 'expected a .dark block in globals.css')
  const end = GLOBALS_CSS.indexOf('}', start)
  return GLOBALS_CSS.slice(start, end)
}

/** The `@theme { … }` block, which holds the light defaults. */
function lightBlock(): string {
  const start = GLOBALS_CSS.indexOf('@theme {')
  assert.notEqual(start, -1, 'expected an @theme block in globals.css')
  const end = GLOBALS_CSS.indexOf('\n}', start)
  return GLOBALS_CSS.slice(start, end)
}

const darkToken = (name: string) => cssToken(darkBlock(), name)
const lightToken = (name: string) => cssToken(lightBlock(), name)

function channels(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((channel) => {
    const c = channel / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

/** Hue in degrees, used to assert the accent stays the same colour family. */
function hue(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => c / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  if (delta === 0) return 0

  const raw =
    max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4

  return (raw * 60 + 360) % 360
}

describe('theme preference rules', () => {
  test('the default is System, so a first visit follows the OS', () => {
    assert.equal(DEFAULT_THEME_PREFERENCE, 'system')
  })

  test('offers exactly System, Light and Dark', () => {
    assert.deepEqual([...THEME_PREFERENCES], ['system', 'light', 'dark'])
    assert.deepEqual(
      THEME_OPTIONS.map((option) => option.value),
      ['system', 'light', 'dark'],
    )
    assert.deepEqual(
      THEME_OPTIONS.map((option) => option.label),
      ['System', 'Light', 'Dark'],
    )
  })

  test('System resolves to whichever the OS asks for', () => {
    assert.equal(resolveTheme('system', true), 'dark')
    assert.equal(resolveTheme('system', false), 'light')
  })

  test('an explicit choice overrides the OS in both directions', () => {
    assert.equal(resolveTheme('light', true), 'light')
    assert.equal(resolveTheme('dark', false), 'dark')
  })

  /*
   * The ground colour is written in three places that cannot import each other:
   * the stylesheet, this module, and the pre-paint script inlined in index.html.
   * Asserting the literal here would only prove this module agrees with itself,
   * so each test below reads the real file. A mismatch is exactly the bug that
   * causes a visible flash on load.
   */
  test('the browser bar colour matches the painted background', () => {
    assert.equal(themeColor('dark'), darkToken('paper').toUpperCase())
    assert.equal(themeColor('light'), lightToken('paper').toUpperCase())
  })

  test('the pre-paint script paints the same ground as the stylesheet', () => {
    const html = readProjectFile('index.html')

    for (const theme of ['dark', 'light'] as const) {
      assert.ok(
        html.includes(themeColor(theme)),
        `index.html should inline ${themeColor(theme)} for the ${theme} ground, so the first paint matches the stylesheet`,
      )
    }
  })

  test('the toggled class is the one the stylesheet declares dark tokens under', () => {
    assert.equal(DARK_CLASS, 'dark')
  })
})

/**
 * Dark must mean *dark charcoal*, not black.
 *
 * A near-black ground is the default a dark theme drifts towards, and it costs
 * SimpleTools its warm-utilitarian identity — so the boundary is asserted in
 * code rather than left to review. `scripts/check-contrast.mjs` computes the
 * same numbers with more coverage; these tests keep the two rules that are
 * product decisions rather than accessibility minimums.
 */
describe('dark palette identity', () => {
  const GROUND_LUMINANCE_FLOOR = 0.012

  test('the dark ground is a charcoal, never black or near-black', () => {
    const paper = darkToken('paper')

    assert.notEqual(paper.toLowerCase(), '#000')
    assert.notEqual(paper.toLowerCase(), '#000000')
    assert.ok(
      luminance(paper) >= GROUND_LUMINANCE_FLOOR,
      `dark paper ${paper} has luminance ${luminance(paper).toFixed(4)}, below the ${GROUND_LUMINANCE_FLOOR} floor that separates charcoal from black`,
    )
  })

  test('cards sit above the page in both themes, not below it', () => {
    assert.ok(
      luminance(darkToken('surface')) > luminance(darkToken('paper')),
      'dark surface should be lighter than dark paper, matching the light theme where white cards sit on warm paper',
    )
    assert.ok(luminance(lightToken('surface')) > luminance(lightToken('paper')))
  })

  test('the teal accent survives into dark mode rather than being swapped out', () => {
    const [lightHue, darkHue] = [lightToken('accent'), darkToken('accent')].map(hue)

    // Same family, lifted for legibility — not a different brand colour.
    assert.ok(
      Math.abs(lightHue - darkHue) < 20,
      `accent hue shifted from ${lightHue.toFixed(0)}° to ${darkHue.toFixed(0)}°, which reads as a different colour`,
    )
    assert.ok(luminance(darkToken('accent')) > luminance(lightToken('accent')))
  })

  test('body text clears WCAG AA on both the page and cards', () => {
    for (const ground of ['paper', 'surface'] as const) {
      for (const text of ['ink', 'muted'] as const) {
        const value = contrast(darkToken(text), darkToken(ground))
        assert.ok(value >= 4.5, `dark ${text} on ${ground} is ${value.toFixed(2)}:1, below AA`)
      }
    }
  })

  test('every dark token has a light counterpart, so nothing falls back mid-theme', () => {
    const names = [...darkBlock().matchAll(/--color-([a-z-]+):/g)].map((m) => m[1])
    assert.ok(names.length > 0)

    const light = lightBlock()
    for (const name of names) {
      assert.ok(light.includes(`--color-${name}:`), `--color-${name} is dark-only`)
    }
  })
})

describe('untrusted preference values', () => {
  test('recognises only the three preferences', () => {
    for (const value of THEME_PREFERENCES) assert.ok(isThemePreference(value))
    for (const value of ['Dark', 'DARK', 'blue', '', 'system ', null, 7, {}, []]) {
      assert.equal(isThemePreference(value), false, `${JSON.stringify(value)} was accepted`)
    }
  })

  test('anything unrecognised falls back to System rather than breaking', () => {
    for (const value of ['blue', '', 'null', 'undefined', null, undefined, 0, NaN, {}, ['dark']]) {
      assert.equal(normaliseThemePreference(value), 'system')
    }
  })

  test('a stored value from an older or tampered build is ignored', () => {
    const { store } = fakeStore({ [THEME_STORAGE_KEY]: 'midnight-neon' })
    assert.equal(readThemePreference(store), 'system')
  })

  test('a valid stored value is honoured', () => {
    for (const value of ['light', 'dark', 'system'] as const) {
      const { store } = fakeStore({ [THEME_STORAGE_KEY]: value })
      assert.equal(readThemePreference(store), value)
    }
  })
})

describe('persistence', () => {
  test('a choice survives a reload', () => {
    const { store, data } = fakeStore()

    assert.equal(writeThemePreference(store, 'dark'), true)
    assert.equal(data.get(THEME_STORAGE_KEY), 'dark')
    // A fresh read of the same storage is what a reload amounts to.
    assert.equal(readThemePreference(store), 'dark')
  })

  test('switching back to System is itself persisted', () => {
    const { store } = fakeStore({ [THEME_STORAGE_KEY]: 'dark' })
    writeThemePreference(store, 'system')
    assert.equal(readThemePreference(store), 'system')
  })

  test('writes go to one namespaced key and no other', () => {
    const { store, writes, data } = fakeStore()

    for (const preference of THEME_PREFERENCES) writeThemePreference(store, preference)

    assert.equal(THEME_STORAGE_KEY, 'simpletools-theme')
    assert.deepEqual([...new Set(writes.map((write) => write.key))], [THEME_STORAGE_KEY])
    assert.deepEqual([...data.keys()], [THEME_STORAGE_KEY])
  })

  test('blocked storage degrades to System instead of throwing', () => {
    assert.equal(readThemePreference(hostileStore), 'system')
    assert.equal(writeThemePreference(hostileStore, 'dark'), false)
  })

  test('absent storage degrades to System instead of throwing', () => {
    assert.equal(readThemePreference(null), 'system')
    assert.equal(writeThemePreference(null, 'dark'), false)
  })
})

describe('storage carries no user data', () => {
  /*
    The product promise is that files never leave the device and are never
    persisted. These tests attack the storage layer with the kind of values a
    file tool handles, and assert that none of them can be stored — not by
    policy but because every write is normalised to one of three literals.
  */
  const userData = [
    'invoice-q3.pdf',
    'C:\\Users\\Admin\\Pictures\\passport.png',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
    'blob:http://localhost:5173/8f2c1e94-1f0e-4a3b-9d77-2b1a5c6d8e90',
    '{"email":"someone@example.com"}',
    '\u0000binary\u0001payload',
  ]

  test('file names, paths, data URLs and blob URLs cannot be written', () => {
    const { store, writes, data } = fakeStore()

    for (const value of userData) {
      // Deliberately bypassing the type system the way a future bug would.
      writeThemePreference(store, value as never)
    }

    for (const write of writes) {
      assert.ok(
        isThemePreference(write.value),
        `stored a non-preference value: ${JSON.stringify(write.value)}`,
      )
    }
    assert.deepEqual([...data.keys()], [THEME_STORAGE_KEY])
    assert.equal(data.get(THEME_STORAGE_KEY), 'system')
  })

  test('reading never returns a value the caller could mistake for user data', () => {
    for (const value of userData) {
      const { store } = fakeStore({ [THEME_STORAGE_KEY]: value })
      assert.ok(isThemePreference(readThemePreference(store)))
    }
  })

  test('the store interface exposes no way to enumerate or clear the origin', () => {
    const { store } = fakeStore()
    assert.deepEqual(Object.keys(store).sort(), ['getItem', 'setItem'])
  })
})
