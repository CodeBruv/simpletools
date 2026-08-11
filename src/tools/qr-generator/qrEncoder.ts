/**
 * QR Code encoder — ISO/IEC 18004, byte mode, versions 1–40.
 *
 * Written in-repo rather than pulled from npm because the QR libraries could
 * not be installed in the environment this was built in (the registry is
 * unreachable), and shipping an untested dependency reference would have left
 * the tool unverifiable. It is also a fair trade on its own terms: this file
 * has no dependencies, adds a few KB, and the project already prefers that
 * over a package where practical.
 *
 * Byte mode only. Numeric and alphanumeric modes pack tighter for digit- or
 * uppercase-only payloads, but byte mode encodes anything, and the capacity we
 * lose is only visible on payloads far larger than a QR code should carry. One
 * fewer branch is worth more here than a smaller symbol.
 *
 * Correctness is checked two ways in qrEncoder.test.ts: the capacity table is
 * cross-checked against the geometry of the symbol (two independent routes to
 * the same numbers), and every generated matrix is decoded back to the bytes
 * that went in.
 */

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

export interface QrMatrix {
  /** Module count per side, excluding the quiet zone. */
  readonly size: number
  readonly version: number
  readonly errorCorrection: ErrorCorrectionLevel
  readonly mask: number
  /** Row-major, true where the module is dark. */
  readonly modules: readonly boolean[][]
}

/** Thrown when a payload cannot be encoded. Carries user-facing wording. */
export class QrEncodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QrEncodeError'
  }
}

export const ERROR_CORRECTION_LEVELS: readonly ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'] as const

const MIN_VERSION = 1
const MAX_VERSION = 40

/* ------------------------------------------------------------------ *
 * Capacity tables
 *
 * Straight from the standard. Everything else about capacity is derived,
 * so these two tables are the only figures that have to be right — which
 * is why the test cross-checks them against the symbol geometry.
 * Index by [level][version]; index 0 of each row is unused.
 * ------------------------------------------------------------------ */

const ECC_CODEWORDS_PER_BLOCK: Record<ErrorCorrectionLevel, readonly number[]> = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
}

const ECC_BLOCK_COUNT: Record<ErrorCorrectionLevel, readonly number[]> = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
}

/**
 * Total data modules in a symbol, before error correction is subtracted.
 *
 * Computed from the geometry — full area, minus the finders and their
 * separators, the timing patterns, the format and version areas, and the
 * alignment patterns — rather than tabulated, so it is an independent check on
 * the tables above.
 */
export function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64

  if (version >= 2) {
    const alignCount = Math.floor(version / 7) + 2
    result -= (25 * alignCount - 10) * alignCount - 55
    if (version >= 7) result -= 36
  }

  return result
}

/** Data codewords available to the payload at this version and level. */
export function dataCodewords(version: number, level: ErrorCorrectionLevel): number {
  return (
    Math.floor(rawDataModules(version) / 8) -
    ECC_CODEWORDS_PER_BLOCK[level][version]! * ECC_BLOCK_COUNT[level][version]!
  )
}

/** Longest byte payload this version and level can hold. */
export function byteCapacity(version: number, level: ErrorCorrectionLevel): number {
  // Header: 4 mode bits, then a character count that widens past version 9.
  const headerBits = 4 + (version >= 10 ? 16 : 8)
  return Math.floor((dataCodewords(version, level) * 8 - headerBits) / 8)
}

/* ------------------------------------------------------------------ *
 * GF(256) arithmetic for Reed–Solomon
 * ------------------------------------------------------------------ */

/** Multiply in GF(256) with the QR primitive polynomial 0x11D. */
function gfMultiply(a: number, b: number): number {
  let result = 0
  for (let shift = 7; shift >= 0; shift -= 1) {
    result = (result << 1) ^ ((result >>> 7) * 0x11d)
    result ^= ((b >>> shift) & 1) * a
  }
  return result & 0xff
}

/** Divisor polynomial for `degree` error-correction codewords. */
function generatorPolynomial(degree: number): number[] {
  // Product of (x - a^i) for i in 0..degree-1, stored without the leading 1.
  const result = new Array<number>(degree).fill(0)
  result[degree - 1] = 1

  let root = 1
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      const scaled = gfMultiply(result[j]!, root)
      result[j] = j + 1 < degree ? scaled ^ result[j + 1]! : scaled
    }
    root = gfMultiply(root, 0x02)
  }

  return result
}

/** Remainder of `data` divided by the generator — the EC codewords. */
function errorCorrectionCodewords(data: readonly number[], degree: number): number[] {
  const divisor = generatorPolynomial(degree)
  const result = new Array<number>(degree).fill(0)

  for (const byte of data) {
    const factor = byte ^ result.shift()!
    result.push(0)
    for (let i = 0; i < degree; i += 1) {
      result[i] = result[i]! ^ gfMultiply(divisor[i]!, factor)
    }
  }

  return result
}

/* ------------------------------------------------------------------ *
 * Bit stream → interleaved codewords
 * ------------------------------------------------------------------ */

const PAD_BYTES = [0xec, 0x11] as const

/** Smallest version that fits `byteLength` at this level. */
function chooseVersion(byteLength: number, level: ErrorCorrectionLevel): number {
  for (let version = MIN_VERSION; version <= MAX_VERSION; version += 1) {
    if (byteCapacity(version, level) >= byteLength) return version
  }

  throw new QrEncodeError(
    'That is too much information for one QR code. Shorten it and try again.',
  )
}

/** Mode indicator, length, payload, terminator, padding — as data codewords. */
function buildDataCodewords(
  bytes: readonly number[],
  version: number,
  level: ErrorCorrectionLevel,
): number[] {
  const bits: number[] = []
  const push = (value: number, width: number) => {
    for (let i = width - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1)
  }

  push(0b0100, 4) // byte mode
  push(bytes.length, version >= 10 ? 16 : 8)
  for (const byte of bytes) push(byte, 8)

  const capacityBits = dataCodewords(version, level) * 8

  // Terminator, then align to a codeword boundary, then alternating pad bytes.
  push(0, Math.min(4, capacityBits - bits.length))
  push(0, (8 - (bits.length % 8)) % 8)

  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j]!
    codewords.push(byte)
  }

  for (let i = 0; codewords.length * 8 < capacityBits; i += 1) {
    codewords.push(PAD_BYTES[i % 2]!)
  }

  return codewords
}

/** How the data codewords are split into blocks at a version and level. */
export interface BlockStructure {
  blockCount: number
  eccPerBlock: number
  /** Data codewords in the shorter blocks; the last `longBlockCount` hold one more. */
  shortBlockLength: number
  longBlockCount: number
}

/**
 * Exported because the round-trip test has to de-interleave the stream it reads
 * back out, and deriving the split from the same tables the encoder used is
 * better than the test carrying a second copy of them.
 */
export function blockStructure(version: number, level: ErrorCorrectionLevel): BlockStructure {
  const blockCount = ECC_BLOCK_COUNT[level][version]!
  const eccPerBlock = ECC_CODEWORDS_PER_BLOCK[level][version]!
  const totalCodewords = Math.floor(rawDataModules(version) / 8)

  return {
    blockCount,
    eccPerBlock,
    shortBlockLength: Math.floor(totalCodewords / blockCount) - eccPerBlock,
    longBlockCount: totalCodewords % blockCount,
  }
}

/**
 * Split into blocks, append each block's EC codewords, then interleave.
 *
 * Interleaving is what makes a QR survive a scratch: damage to one region of
 * the symbol is spread across several blocks, so no single block exceeds its
 * correction budget.
 */
function interleave(
  data: readonly number[],
  version: number,
  level: ErrorCorrectionLevel,
): number[] {
  const { blockCount, eccPerBlock, shortBlockLength, longBlockCount } = blockStructure(
    version,
    level,
  )

  const dataBlocks: number[][] = []
  const eccBlocks: number[][] = []

  let offset = 0
  for (let i = 0; i < blockCount; i += 1) {
    const length = shortBlockLength + (i < blockCount - longBlockCount ? 0 : 1)
    const block = data.slice(offset, offset + length)
    offset += length
    dataBlocks.push(block)
    eccBlocks.push(errorCorrectionCodewords(block, eccPerBlock))
  }

  const result: number[] = []

  // Data codewords column-first. Short blocks simply run out a column early.
  for (let i = 0; i < shortBlockLength + 1; i += 1) {
    for (let b = 0; b < blockCount; b += 1) {
      const codeword = dataBlocks[b]![i]
      if (codeword !== undefined) result.push(codeword)
    }
  }

  // Then the EC codewords, which are all the same length.
  for (let i = 0; i < eccPerBlock; i += 1) {
    for (let b = 0; b < blockCount; b += 1) result.push(eccBlocks[b]![i]!)
  }

  return result
}

/* ------------------------------------------------------------------ *
 * Module placement
 * ------------------------------------------------------------------ */

/** Centre coordinates of the alignment patterns for a version. */
export function alignmentPositions(version: number): number[] {
  if (version === 1) return []

  const count = Math.floor(version / 7) + 2
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2

  const positions = [6]
  for (let pos = version * 4 + 10; positions.length < count; pos -= step) {
    positions.splice(1, 0, pos)
  }

  return positions
}

type Grid = Array<Array<boolean | null>>

/**
 * True where a function pattern sits, so nothing writes data over one.
 * Exported because the round-trip test has to walk the same free modules the
 * encoder wrote to in order to read the payload back out.
 */
export function functionModuleMap(version: number): boolean[][] {
  const size = version * 4 + 17
  return drawFunctionPatterns(version, size).map((row) => row.map((module) => module !== null))
}

/** Function patterns, drawn first. `null` marks a module still free for data. */
function drawFunctionPatterns(version: number, size: number): Grid {
  const grid: Grid = Array.from({ length: size }, () => new Array<boolean | null>(size).fill(null))

  const setArea = (
    top: number,
    left: number,
    height: number,
    width: number,
    paint: (row: number, col: number) => boolean,
  ) => {
    for (let r = 0; r < height; r += 1) {
      for (let c = 0; c < width; c += 1) {
        const row = top + r
        const col = left + c
        if (row >= 0 && row < size && col >= 0 && col < size) grid[row]![col] = paint(r, c)
      }
    }
  }

  // Finder patterns with their separators: a 7x7 target inside a 9x9 box whose
  // outermost ring is the light separator. Centres sit 3 modules in from each
  // corner, so the box always starts 4 before the centre.
  const finder = (centreRow: number, centreCol: number) => {
    setArea(centreRow - 4, centreCol - 4, 9, 9, (r, c) => {
      const ring = Math.max(Math.abs(r - 4), Math.abs(c - 4))
      return ring !== 2 && ring !== 4
    })
  }
  finder(3, 3)
  finder(3, size - 4)
  finder(size - 4, 3)

  // Timing patterns: alternating modules bridging the finders.
  for (let i = 8; i < size - 8; i += 1) {
    const dark = i % 2 === 0
    grid[6]![i] = dark
    grid[i]![6] = dark
  }

  // Alignment patterns, skipping the three corners the finders already own.
  const positions = alignmentPositions(version)
  for (const row of positions) {
    for (const col of positions) {
      const atFinder =
        (row === 6 && col === 6) ||
        (row === 6 && col === size - 7) ||
        (row === size - 7 && col === 6)
      if (atFinder) continue

      setArea(row - 2, col - 2, 5, 5, (r, c) => Math.max(Math.abs(r - 2), Math.abs(c - 2)) !== 1)
    }
  }

  // Format areas are reserved now and filled once the mask is known.
  for (let i = 0; i < 9; i += 1) {
    if (grid[8]![i] === null) grid[8]![i] = false
    if (grid[i]![8] === null) grid[i]![8] = false
  }
  for (let i = 0; i < 8; i += 1) {
    if (grid[8]![size - 1 - i] === null) grid[8]![size - 1 - i] = false
    if (grid[size - 1 - i]![8] === null) grid[size - 1 - i]![8] = false
  }
  grid[size - 8]![8] = true // the always-dark module

  // Version information, versions 7 and up.
  if (version >= 7) {
    const bits = versionInformation(version)
    for (let i = 0; i < 18; i += 1) {
      const bit = ((bits >>> i) & 1) === 1
      const a = Math.floor(i / 3)
      const b = (i % 3) + size - 11
      grid[a]![b] = bit
      grid[b]![a] = bit
    }
  }

  return grid
}

/** BCH(18,6) version information, generator 0x1F25. */
export function versionInformation(version: number): number {
  let remainder = version
  for (let i = 0; i < 12; i += 1) {
    remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25)
  }
  return ((version << 12) | remainder) & 0x3ffff
}

const FORMAT_BITS: Record<ErrorCorrectionLevel, number> = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 }

/** BCH(15,5) format information, generator 0x537, masked with 0x5412. */
export function formatInformation(level: ErrorCorrectionLevel, mask: number): number {
  const data = (FORMAT_BITS[level] << 3) | mask
  let remainder = data
  for (let i = 0; i < 10; i += 1) {
    remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537)
  }
  return (((data << 10) | remainder) ^ 0x5412) & 0x7fff
}

/**
 * Writes the 15 format bits into both of their copies.
 *
 * Bits run down column 8 and along row 8 beside the top-left finder, skipping
 * the timing modules at index 6; the second copy is split between the other
 * two finders so a damaged corner still leaves one readable copy.
 */
function drawFormatInformation(grid: Grid, level: ErrorCorrectionLevel, mask: number): void {
  const size = grid.length
  const bits = formatInformation(level, mask)
  const bit = (index: number) => ((bits >>> index) & 1) === 1

  // Copy one: down column 8, then left along row 8.
  for (let i = 0; i <= 5; i += 1) grid[i]![8] = bit(i)
  grid[7]![8] = bit(6)
  grid[8]![8] = bit(7)
  grid[8]![7] = bit(8)
  for (let i = 9; i < 15; i += 1) grid[8]![14 - i] = bit(i)

  // Copy two: along row 8 from the right edge, then up column 8 from the bottom.
  for (let i = 0; i < 8; i += 1) grid[8]![size - 1 - i] = bit(i)
  for (let i = 8; i < 15; i += 1) grid[size - 15 + i]![8] = bit(i)
}

/** The eight mask conditions. True means the module is inverted. */
function maskCondition(mask: number, row: number, col: number): boolean {
  switch (mask) {
    case 0:
      return (row + col) % 2 === 0
    case 1:
      return row % 2 === 0
    case 2:
      return col % 3 === 0
    case 3:
      return (row + col) % 3 === 0
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0
    case 7:
      return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0
    default:
      throw new QrEncodeError('Unknown mask pattern.')
  }
}

/**
 * Lays the codewords into the grid and applies the mask in one pass.
 *
 * Placement runs bottom-right to top-left in two-column strips, alternating
 * direction, skipping the vertical timing column and every module a function
 * pattern already claimed.
 */
function drawCodewords(grid: Grid, codewords: readonly number[], mask: number): void {
  const size = grid.length
  let bitIndex = 0

  for (let right = size - 1; right >= 1; right -= 2) {
    // The vertical timing pattern occupies column 6, which belongs to no strip.
    // Shifting to 5 lets the remaining pairs fall out naturally as 5|4, 3|2, 1|0.
    if (right === 6) right = 5
    const rightCol = right
    const upward = ((rightCol + 1) & 2) === 0

    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step

      for (let offset = 0; offset < 2; offset += 1) {
        const col = rightCol - offset
        if (grid[row]![col] !== null) continue

        // Past the end of the stream the remainder bits stay light, which is
        // what the standard expects.
        const bit =
          bitIndex < codewords.length * 8
            ? ((codewords[bitIndex >>> 3]! >>> (7 - (bitIndex & 7))) & 1) === 1
            : false
        bitIndex += 1

        grid[row]![col] = bit !== maskCondition(mask, row, col)
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Mask selection
 *
 * The standard scores all eight and keeps the lowest. The rules penalise the
 * patterns that make a symbol hard to read: long same-colour runs, solid
 * blocks, anything resembling a finder, and a badly skewed dark/light balance.
 * ------------------------------------------------------------------ */

const FINDER_LIKE = [true, false, true, true, true, false, true] as const

function runPenalty(run: number): number {
  return run >= 5 ? 3 + (run - 5) : 0
}

function penalty(modules: readonly boolean[][]): number {
  const size = modules.length
  let score = 0

  // Rule 1: runs of five or more identical modules in a row or column.
  for (let i = 0; i < size; i += 1) {
    let rowRun = 1
    let colRun = 1
    for (let j = 1; j < size; j += 1) {
      if (modules[i]![j] === modules[i]![j - 1]) rowRun += 1
      else {
        score += runPenalty(rowRun)
        rowRun = 1
      }
      if (modules[j]![i] === modules[j - 1]![i]) colRun += 1
      else {
        score += runPenalty(colRun)
        colRun = 1
      }
    }
    score += runPenalty(rowRun) + runPenalty(colRun)
  }

  // Rule 2: every 2x2 block of one colour.
  for (let i = 0; i < size - 1; i += 1) {
    for (let j = 0; j < size - 1; j += 1) {
      const module = modules[i]![j]
      if (
        module === modules[i]![j + 1] &&
        module === modules[i + 1]![j] &&
        module === modules[i + 1]![j + 1]
      ) {
        score += 3
      }
    }
  }

  // Rule 3: the finder-like 1:1:3:1:1 sequence with four light modules beside
  // it, which a scanner could mistake for a real finder pattern.
  const matchesFinder = (get: (index: number) => boolean, start: number): boolean => {
    for (let k = 0; k < 7; k += 1) {
      if (get(start + k) !== FINDER_LIKE[k]) return false
    }
    return true
  }
  const lightRun = (get: (index: number) => boolean, start: number, length: number): boolean => {
    for (let k = 0; k < 4; k += 1) {
      const index = start + k
      if (index < 0 || index >= length) continue // outside the symbol counts as light
      if (get(index)) return false
    }
    return true
  }

  for (let i = 0; i < size; i += 1) {
    const row = (j: number) => modules[i]![j]!
    const col = (j: number) => modules[j]![i]!

    for (let j = 0; j <= size - 7; j += 1) {
      for (const get of [row, col]) {
        if (!matchesFinder(get, j)) continue
        if (lightRun(get, j - 4, size) || lightRun(get, j + 7, size)) score += 40
      }
    }
  }

  // Rule 4: deviation from an even split of dark and light.
  let dark = 0
  for (const row of modules) for (const module of row) if (module) dark += 1

  const percent = (dark * 100) / (size * size)
  score += Math.floor(Math.abs(percent - 50) / 5) * 10

  return score
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

/** UTF-8 bytes. Scanners read byte mode as UTF-8 in practice. */
function toUtf8(text: string): number[] {
  return Array.from(new TextEncoder().encode(text))
}

export interface EncodeOptions {
  errorCorrection?: ErrorCorrectionLevel
  /** Fixes the mask instead of choosing the best one. Tests only. */
  forceMask?: number
}

/**
 * Encode text as a QR matrix.
 *
 * Picks the smallest version that fits, then the mask that scores best.
 */
export function encodeQr(text: string, options: EncodeOptions = {}): QrMatrix {
  const level = options.errorCorrection ?? 'M'

  if (text.length === 0) {
    throw new QrEncodeError('There is nothing to put in the QR code yet.')
  }

  const bytes = toUtf8(text)
  const version = chooseVersion(bytes.length, level)
  const size = version * 4 + 17

  const codewords = interleave(buildDataCodewords(bytes, version, level), version, level)

  let best: { mask: number; modules: boolean[][] } | null = null
  let bestScore = Infinity

  const candidates =
    options.forceMask === undefined ? [0, 1, 2, 3, 4, 5, 6, 7] : [options.forceMask]

  for (const mask of candidates) {
    const grid = drawFunctionPatterns(version, size)
    drawFormatInformation(grid, level, mask)
    drawCodewords(grid, codewords, mask)

    const modules = grid.map((row) => row.map((module) => module === true))
    const score = penalty(modules)

    if (score < bestScore) {
      bestScore = score
      best = { mask, modules }
    }
  }

  if (!best) throw new QrEncodeError('Could not build a QR code from that.')

  return {
    size,
    version,
    errorCorrection: level,
    mask: best.mask,
    modules: best.modules,
  }
}
