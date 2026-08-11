import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  ERROR_CORRECTION_LEVELS,
  QrEncodeError,
  alignmentPositions,
  byteCapacity,
  encodeQr,
  formatInformation,
  versionInformation,
  type ErrorCorrectionLevel,
} from '@/tools/qr-generator/qrEncoder'
import { decodeMatrix, readFormatCopies } from '@/tools/qr-generator/testDecoder'

/**
 * The encoder is vendored, so it gets checked against things that do not come
 * from the encoder itself.
 *
 * Two independent routes. First, published constants: capacities, BCH format
 * and version bit strings, alignment-pattern centres. Getting these right by
 * accident is not plausible. Second, a decoder that unmasks, un-zigzags,
 * de-interleaves and parses the symbol back to the bytes that went in — which
 * fails if placement, masking, block splitting or the bit stream is wrong
 * anywhere.
 */

/* ------------------------------------------------------------------ *
 * Published constants
 * ------------------------------------------------------------------ */

describe('capacity table', () => {
  // ISO/IEC 18004 Table 7, byte mode. Versions 1-10 at all four levels.
  const PUBLISHED: Record<ErrorCorrectionLevel, readonly number[]> = {
    L: [17, 32, 53, 78, 106, 134, 154, 192, 230, 271],
    M: [14, 26, 42, 62, 84, 106, 122, 152, 180, 213],
    Q: [11, 20, 32, 46, 60, 74, 86, 108, 130, 151],
    H: [7, 14, 24, 34, 44, 58, 64, 84, 98, 119],
  }

  test('matches the published byte capacities for versions 1-10', () => {
    for (const level of ERROR_CORRECTION_LEVELS) {
      PUBLISHED[level].forEach((expected, index) => {
        const version = index + 1
        assert.equal(
          byteCapacity(version, level),
          expected,
          `version ${version} level ${level}`,
        )
      })
    }
  })

  test('matches the published byte capacities at version 40', () => {
    assert.equal(byteCapacity(40, 'L'), 2953)
    assert.equal(byteCapacity(40, 'M'), 2331)
    assert.equal(byteCapacity(40, 'Q'), 1663)
    assert.equal(byteCapacity(40, 'H'), 1273)
  })

  test('capacity rises with version and falls as correction strengthens', () => {
    for (const level of ERROR_CORRECTION_LEVELS) {
      for (let version = 2; version <= 40; version += 1) {
        assert.ok(
          byteCapacity(version, level) > byteCapacity(version - 1, level),
          `version ${version} level ${level} did not grow`,
        )
      }
    }

    for (let version = 1; version <= 40; version += 1) {
      assert.ok(byteCapacity(version, 'L') > byteCapacity(version, 'M'))
      assert.ok(byteCapacity(version, 'M') > byteCapacity(version, 'Q'))
      assert.ok(byteCapacity(version, 'Q') > byteCapacity(version, 'H'))
    }
  })
})

/** Polynomial remainder over GF(2), for checking the BCH codes structurally. */
function remainderGf2(value: number, generator: number, width: number): number {
  let remainder = value
  const generatorWidth = 32 - Math.clz32(generator)

  for (let bit = width - 1; bit >= generatorWidth - 1; bit -= 1) {
    if ((remainder >>> bit) & 1) remainder ^= generator << (bit - generatorWidth + 1)
  }

  return remainder
}

function hammingWeight(value: number): number {
  let count = 0
  let bits = value
  while (bits !== 0) {
    count += bits & 1
    bits >>>= 1
  }
  return count
}

describe('BCH bit strings', () => {
  test('format information matches the published values', () => {
    // ISO/IEC 18004 Table C.1.
    assert.equal(formatInformation('L', 0), 0x77c4)
    assert.equal(formatInformation('L', 7), 0x6976)
    assert.equal(formatInformation('M', 0), 0x5412)
    assert.equal(formatInformation('Q', 0), 0x355f)
    assert.equal(formatInformation('H', 0), 0x1689)
  })

  test('version information matches the published values', () => {
    // ISO/IEC 18004 Table D.1.
    assert.equal(versionInformation(7), 0x07c94)
    assert.equal(versionInformation(40), 0x28c69)
  })

  // The two checks below hold for any correct BCH implementation, so they catch
  // a wrong generator or a wrong XOR mask without depending on a transcribed
  // table at all.
  test('every format string is a valid BCH(15,5) codeword carrying its own data', () => {
    for (const level of ERROR_CORRECTION_LEVELS) {
      for (let mask = 0; mask < 8; mask += 1) {
        const unmasked = formatInformation(level, mask) ^ 0x5412
        assert.equal(remainderGf2(unmasked, 0x537, 15), 0, `level ${level} mask ${mask}`)
        assert.equal(unmasked >>> 10 & 0b111, mask, `level ${level} mask ${mask} lost its mask bits`)
      }
    }
  })

  test('every version string is a valid BCH(18,6) codeword carrying its version', () => {
    for (let version = 7; version <= 40; version += 1) {
      const bits = versionInformation(version)
      assert.equal(remainderGf2(bits, 0x1f25, 18), 0, `version ${version}`)
      assert.equal(bits >>> 12, version, `version ${version} lost its version bits`)
    }
  })

  test('format strings stay 7 bits apart, so a damaged corner still reads', () => {
    const all: number[] = []
    for (const level of ERROR_CORRECTION_LEVELS) {
      for (let mask = 0; mask < 8; mask += 1) all.push(formatInformation(level, mask))
    }

    for (let i = 0; i < all.length; i += 1) {
      for (let j = i + 1; j < all.length; j += 1) {
        const distance = hammingWeight(all[i]! ^ all[j]!)
        assert.ok(distance >= 7, `format strings ${i} and ${j} are only ${distance} bits apart`)
      }
    }
  })
})

describe('alignment patterns', () => {
  test('match the published centres', () => {
    assert.deepEqual(alignmentPositions(1), [])
    assert.deepEqual(alignmentPositions(2), [6, 18])
    assert.deepEqual(alignmentPositions(7), [6, 22, 38])
    assert.deepEqual(alignmentPositions(32), [6, 34, 60, 86, 112, 138])
    assert.deepEqual(alignmentPositions(40), [6, 30, 58, 86, 114, 142, 170])
  })

  test('always start at 6 and end 7 modules from the far edge', () => {
    for (let version = 2; version <= 40; version += 1) {
      const positions = alignmentPositions(version)
      assert.equal(positions[0], 6)
      assert.equal(positions[positions.length - 1], version * 4 + 10)
    }
  })
})

/* ------------------------------------------------------------------ *
 * Structure
 * ------------------------------------------------------------------ */

describe('matrix structure', () => {
  test('reports a size consistent with its version', () => {
    const matrix = encodeQr('https://simpletools.example')
    assert.equal(matrix.size, matrix.version * 4 + 17)
    assert.equal(matrix.modules.length, matrix.size)
    for (const row of matrix.modules) assert.equal(row.length, matrix.size)
  })

  test('draws all three finder patterns', () => {
    const { modules, size } = encodeQr('finders')
    const centres = [
      [3, 3],
      [3, size - 4],
      [size - 4, 3],
    ]

    for (const [row, col] of centres) {
      for (let r = -4; r <= 4; r += 1) {
        for (let c = -4; c <= 4; c += 1) {
          const y = row! + r
          const x = col! + c
          if (y < 0 || y >= size || x < 0 || x >= size) continue

          const ring = Math.max(Math.abs(r), Math.abs(c))
          assert.equal(
            modules[y]![x],
            ring !== 2 && ring !== 4,
            `finder at ${row},${col} wrong at offset ${r},${c}`,
          )
        }
      }
    }
  })

  test('draws both timing patterns', () => {
    const { modules, size } = encodeQr('timing')
    for (let i = 8; i < size - 8; i += 1) {
      assert.equal(modules[6]![i], i % 2 === 0, `horizontal timing wrong at ${i}`)
      assert.equal(modules[i]![6], i % 2 === 0, `vertical timing wrong at ${i}`)
    }
  })

  test('sets the always-dark module', () => {
    const { modules, size } = encodeQr('dark module')
    assert.equal(modules[size - 8]![8], true)
  })

  test('writes both format copies with the level and mask it reports', () => {
    for (const level of ERROR_CORRECTION_LEVELS) {
      const matrix = encodeQr('format copies', { errorCorrection: level })
      const expected = formatInformation(level, matrix.mask)
      const [first, second] = readFormatCopies(matrix)

      assert.equal(first, expected, `first copy at level ${level}`)
      assert.equal(second, expected, `second copy at level ${level}`)
    }
  })
})

/* ------------------------------------------------------------------ *
 * Round trip
 * ------------------------------------------------------------------ */

describe('round trip', () => {
  const PAYLOADS: ReadonlyArray<[string, string]> = [
    ['short url', 'https://simpletools.example'],
    ['plain text', 'Table 12 — back patio'],
    ['mailto', 'mailto:hello@example.com?subject=Order%20%231234&body=Hi%20there'],
    ['tel', 'tel:+15551234567'],
    ['smsto', 'SMSTO:+15551234567:Running five minutes late'],
    ['wifi with escapes', 'WIFI:T:WPA;S:Joe\\;s Cafe;P:p\\:ss\\,word\\\\;;'],
    ['utf-8', 'Café — 北京 — emoji ✅'],
    ['single character', 'x'],
    ['400 characters', 'a'.repeat(400)],
    ['1200 characters', 'The quick brown fox. '.repeat(60)],
  ]

  for (const [name, payload] of PAYLOADS) {
    for (const level of ERROR_CORRECTION_LEVELS) {
      test(`${name} survives encoding at level ${level}`, () => {
        const matrix = encodeQr(payload, { errorCorrection: level })
        assert.equal(decodeMatrix(matrix), payload)
        assert.equal(matrix.errorCorrection, level)
      })
    }
  }

  test('decodes correctly under every mask, not just the chosen one', () => {
    for (let mask = 0; mask < 8; mask += 1) {
      const matrix = encodeQr('https://simpletools.example/menu', { forceMask: mask })
      assert.equal(matrix.mask, mask)
      assert.equal(decodeMatrix(matrix), 'https://simpletools.example/menu')
    }
  })

  test('survives a version that carries the wider length header', () => {
    // Version 10 and up encodes the character count in 16 bits instead of 8.
    const payload = 'b'.repeat(300)
    const matrix = encodeQr(payload, { errorCorrection: 'M' })

    assert.ok(matrix.version >= 10, `expected version 10+, got ${matrix.version}`)
    assert.equal(decodeMatrix(matrix), payload)
  })

  test('survives a version split across several blocks', () => {
    const payload = 'c'.repeat(700)
    const matrix = encodeQr(payload, { errorCorrection: 'H' })

    assert.equal(decodeMatrix(matrix), payload)
  })
})

/* ------------------------------------------------------------------ *
 * Version choice and limits
 * ------------------------------------------------------------------ */

describe('version selection', () => {
  test('picks the smallest version that fits', () => {
    assert.equal(encodeQr('a'.repeat(14), { errorCorrection: 'M' }).version, 1)
    assert.equal(encodeQr('a'.repeat(15), { errorCorrection: 'M' }).version, 2)
    assert.equal(encodeQr('a'.repeat(26), { errorCorrection: 'M' }).version, 2)
    assert.equal(encodeQr('a'.repeat(27), { errorCorrection: 'M' }).version, 3)
  })

  test('grows the symbol as correction strengthens', () => {
    const payload = 'd'.repeat(100)
    const low = encodeQr(payload, { errorCorrection: 'L' }).version
    const high = encodeQr(payload, { errorCorrection: 'H' }).version

    assert.ok(high > low, `expected H (${high}) to need a bigger symbol than L (${low})`)
  })

  test('fills a symbol exactly at its stated capacity', () => {
    for (const level of ERROR_CORRECTION_LEVELS) {
      const payload = 'e'.repeat(byteCapacity(9, level))
      const matrix = encodeQr(payload, { errorCorrection: level })

      assert.ok(matrix.version <= 9, `level ${level} overflowed to version ${matrix.version}`)
      assert.equal(decodeMatrix(matrix), payload)
    }
  })

  test('counts UTF-8 bytes rather than characters', () => {
    // Each of these is three bytes, so 14 characters cannot fit a version 1 M
    // symbol even though 14 ASCII characters do.
    assert.ok(encodeQr('北'.repeat(14), { errorCorrection: 'M' }).version > 1)
  })
})

describe('refusals', () => {
  test('rejects empty text with wording a user can read', () => {
    assert.throws(
      () => encodeQr(''),
      (error: unknown) => {
        assert.ok(error instanceof QrEncodeError)
        assert.doesNotMatch((error as Error).message, /undefined|null|codeword|version/i)
        return true
      },
    )
  })

  test('rejects a payload larger than any symbol', () => {
    assert.throws(() => encodeQr('f'.repeat(3000), { errorCorrection: 'L' }), QrEncodeError)
  })

  test('accepts the largest payload that does fit', () => {
    const payload = 'g'.repeat(byteCapacity(40, 'L'))
    const matrix = encodeQr(payload, { errorCorrection: 'L' })

    assert.equal(matrix.version, 40)
    assert.equal(decodeMatrix(matrix), payload)
  })
})
