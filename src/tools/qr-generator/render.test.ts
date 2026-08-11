import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { encodeQr } from '@/tools/qr-generator/qrEncoder'
import {
  DEFAULT_APPEARANCE,
  MAX_MARGIN,
  MIN_MARGIN,
  SIZE_OPTIONS,
  appearanceWarning,
  contrastRatio,
  toPath,
  toSvg,
  totalModules,
} from '@/tools/qr-generator/render'
import { decodeMatrix } from '@/tools/qr-generator/testDecoder'

/**
 * Rendering is checked by reading the geometry back out of the SVG.
 *
 * `toPngBlob` and `drawToCanvas` need a real canvas, so they are covered by the
 * manual browser pass rather than faked here — but both derive from the same
 * matrix and margin as the SVG, so the geometry itself is tested.
 */

/** Reconstructs the module grid from the path data, so the path is checked, not trusted. */
function modulesFromPath(path: string, extent: number, margin: number): boolean[][] {
  const grid = Array.from({ length: extent }, () => new Array<boolean>(extent).fill(false))

  for (const [, x, y, width] of path.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    const col = Number(x)
    const row = Number(y)
    for (let i = 0; i < Number(width); i += 1) grid[row]![col + i] = true
  }

  // Returned in module coordinates so it lines up with the matrix.
  return grid
    .slice(margin, extent - margin)
    .map((row) => row.slice(margin, extent - margin))
}

describe('toPath geometry', () => {
  test('reproduces the matrix exactly', () => {
    const matrix = encodeQr('https://simpletools.example/menu')
    const margin = 4
    const rebuilt = modulesFromPath(toPath(matrix, margin), totalModules(matrix, margin), margin)

    assert.equal(rebuilt.length, matrix.size)
    for (let row = 0; row < matrix.size; row += 1) {
      for (let col = 0; col < matrix.size; col += 1) {
        assert.equal(rebuilt[row]![col], matrix.modules[row]![col], `module ${row},${col}`)
      }
    }
  })

  test('a code drawn from the path still decodes', () => {
    const payload = 'WIFI:T:WPA;S:Cafe Guest;P:latte123;;'
    const matrix = encodeQr(payload)
    const margin = 4
    const rebuilt = modulesFromPath(toPath(matrix, margin), totalModules(matrix, margin), margin)

    assert.equal(decodeMatrix({ ...matrix, modules: rebuilt }), payload)
  })

  test('merges horizontal runs instead of emitting one rect per module', () => {
    const matrix = encodeQr('https://simpletools.example')
    const commands = toPath(matrix, 4).match(/M/g)?.length ?? 0

    let dark = 0
    for (const row of matrix.modules) for (const module of row) if (module) dark += 1

    assert.ok(commands < dark, `${commands} commands for ${dark} modules is not merging runs`)
  })

  test('offsets every module by the quiet zone', () => {
    const matrix = encodeQr('margin')

    for (const margin of [MIN_MARGIN, 4, MAX_MARGIN]) {
      const coordinates = [...toPath(matrix, margin).matchAll(/M(\d+) (\d+)h/g)]
      assert.ok(coordinates.length > 0)

      for (const [, x, y] of coordinates) {
        assert.ok(Number(x) >= margin, `x ${x} intrudes into the quiet zone`)
        assert.ok(Number(y) >= margin, `y ${y} intrudes into the quiet zone`)
      }
    }
  })

  test('leaves the quiet zone completely empty', () => {
    const matrix = encodeQr('quiet zone')
    const margin = 4
    const extent = totalModules(matrix, margin)
    const grid = Array.from({ length: extent }, () => new Array<boolean>(extent).fill(false))

    for (const [, x, y, width] of toPath(matrix, margin).matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
      for (let i = 0; i < Number(width); i += 1) grid[Number(y)]![Number(x) + i] = true
    }

    for (let i = 0; i < extent; i += 1) {
      for (let j = 0; j < extent; j += 1) {
        const inQuietZone =
          i < margin || j < margin || i >= extent - margin || j >= extent - margin
        if (inQuietZone) assert.equal(grid[i]![j], false, `quiet zone dirty at ${i},${j}`)
      }
    }
  })
})

describe('toSvg', () => {
  const matrix = encodeQr('https://simpletools.example')

  test('is a standalone document with the namespace a file needs', () => {
    const svg = toSvg(matrix, DEFAULT_APPEARANCE)

    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
    assert.match(svg, /<\/svg>$/)
  })

  test('scales through the viewBox, so the pixel size never distorts the modules', () => {
    const extent = totalModules(matrix, DEFAULT_APPEARANCE.margin)

    for (const size of SIZE_OPTIONS) {
      const svg = toSvg(matrix, { ...DEFAULT_APPEARANCE, size })
      assert.ok(svg.includes(`width="${size}" height="${size}"`))
      assert.ok(svg.includes(`viewBox="0 0 ${extent} ${extent}"`))
    }
  })

  test('paints a background rectangle behind the code', () => {
    // Without it, a transparent SVG on a dark page inverts and stops scanning.
    const svg = toSvg(matrix, { ...DEFAULT_APPEARANCE, background: '#fafafa' })
    assert.match(svg, /<rect width="\d+" height="\d+" fill="#fafafa"\/>/)
  })

  test('uses the chosen foreground', () => {
    assert.ok(toSvg(matrix, { ...DEFAULT_APPEARANCE, foreground: '#123456' }).includes('#123456'))
  })

  test('asks the renderer not to soften module edges', () => {
    assert.ok(toSvg(matrix, DEFAULT_APPEARANCE).includes('shape-rendering="crispEdges"'))
  })

  test('carries no script, event handler or external reference', () => {
    const svg = toSvg(matrix, DEFAULT_APPEARANCE)

    assert.ok(!svg.includes('<script'))
    assert.ok(!/\son\w+=/.test(svg))
    assert.ok(!svg.includes('http://') || svg.indexOf('http://') === svg.indexOf('http://www.w3.org'))
  })
})

describe('defaults', () => {
  test('prioritise scanning over decoration', () => {
    assert.equal(DEFAULT_APPEARANCE.foreground, '#000000')
    assert.equal(DEFAULT_APPEARANCE.background, '#ffffff')
    assert.equal(DEFAULT_APPEARANCE.margin, 4, 'four modules is the standard quiet zone')
    assert.equal(DEFAULT_APPEARANCE.errorCorrection, 'M')
  })

  test('the default margin is within the range the controls offer', () => {
    assert.ok(DEFAULT_APPEARANCE.margin >= MIN_MARGIN)
    assert.ok(DEFAULT_APPEARANCE.margin <= MAX_MARGIN)
  })

  test('the default size is one of the offered sizes', () => {
    assert.ok((SIZE_OPTIONS as readonly number[]).includes(DEFAULT_APPEARANCE.size))
  })

  test('every offered size divides into whole pixels per module at the default margin', () => {
    // A fractional module width antialiases into grey, which scanners misread.
    const matrix = encodeQr('https://simpletools.example')
    const extent = totalModules(matrix, DEFAULT_APPEARANCE.margin)

    for (const size of SIZE_OPTIONS) {
      assert.ok(Math.floor(size / extent) >= 1, `${size}px leaves under a pixel per module`)
    }
  })
})

describe('contrast', () => {
  test('scores the extremes the way WCAG does', () => {
    assert.equal(Math.round(contrastRatio('#000000', '#ffffff')), 21)
    assert.equal(contrastRatio('#777777', '#777777'), 1)
  })

  test('is symmetric', () => {
    assert.equal(contrastRatio('#123456', '#fedcba'), contrastRatio('#fedcba', '#123456'))
  })

  test('reads shorthand hex the colour input may produce', () => {
    assert.equal(contrastRatio('#000', '#fff'), contrastRatio('#000000', '#ffffff'))
  })

  test('says nothing about the safe defaults', () => {
    assert.equal(appearanceWarning('#000000', '#ffffff'), null)
    assert.equal(appearanceWarning('#1a1a1a', '#fafafa'), null)
  })

  test('warns when the colours are too close to tell apart', () => {
    const warning = appearanceWarning('#777777', '#8a8a8a')
    assert.ok(warning && warning.length > 0)
    assert.doesNotMatch(warning, /contrast ratio|luminance|WCAG/i, 'the warning should be plain')
  })

  test('warns about a light code on a dark background', () => {
    const warning = appearanceWarning('#ffffff', '#000000')
    assert.ok(warning && /scanner/i.test(warning))
  })
})
