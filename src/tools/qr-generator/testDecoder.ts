import {
  blockStructure,
  functionModuleMap,
  type QrMatrix,
} from '@/tools/qr-generator/qrEncoder'

/**
 * A minimal QR reader, used only by qrEncoder.test.ts.
 *
 * The point is to check the encoder against something other than itself. This
 * walks the symbol in the opposite direction — unmask, un-zigzag, de-interleave,
 * parse the header — and hands back the text. If module placement, masking,
 * block splitting or the bit stream is wrong anywhere, the bytes come back
 * wrong and the test fails.
 *
 * Deliberately not error-correcting: it reads the data codewords and ignores
 * the EC ones. Reed-Solomon correction would let a genuinely broken encoder
 * still decode cleanly, which is the opposite of what a test wants.
 *
 * Nothing in the app imports this, so it never reaches the bundle.
 */

/** Same mask conditions as the encoder, restated so a shared bug cannot hide. */
function maskCondition(mask: number, row: number, col: number): boolean {
  const conditions: Record<number, () => boolean> = {
    0: () => (row + col) % 2 === 0,
    1: () => row % 2 === 0,
    2: () => col % 3 === 0,
    3: () => (row + col) % 3 === 0,
    4: () => (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0,
    5: () => ((row * col) % 2) + ((row * col) % 3) === 0,
    6: () => (((row * col) % 2) + ((row * col) % 3)) % 2 === 0,
    7: () => (((row + col) % 2) + ((row * col) % 3)) % 2 === 0,
  }

  const condition = conditions[mask]
  if (!condition) throw new Error(`unknown mask ${mask}`)
  return condition()
}

/** Reads the interleaved codeword stream back out of the symbol. */
function readCodewords(matrix: QrMatrix): number[] {
  const { size, mask, modules } = matrix
  const reserved = functionModuleMap(matrix.version)

  const bits: number[] = []
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    const rightCol = right
    const upward = ((rightCol + 1) & 2) === 0

    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step

      for (let offset = 0; offset < 2; offset += 1) {
        const col = rightCol - offset
        if (reserved[row]![col]) continue

        const dark = modules[row]![col] === true
        bits.push(dark !== maskCondition(mask, row, col) ? 1 : 0)
      }
    }
  }

  const codewords: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j]!
    codewords.push(byte)
  }

  return codewords
}

/** Undoes the block interleaving, returning the data codewords in order. */
function deinterleave(matrix: QrMatrix, stream: readonly number[]): number[] {
  const { blockCount, shortBlockLength, longBlockCount } = blockStructure(
    matrix.version,
    matrix.errorCorrection,
  )

  const lengths = Array.from({ length: blockCount }, (_, index) =>
    index < blockCount - longBlockCount ? shortBlockLength : shortBlockLength + 1,
  )

  const blocks: number[][] = lengths.map(() => [])
  let cursor = 0

  for (let i = 0; i < shortBlockLength + 1; i += 1) {
    for (let b = 0; b < blockCount; b += 1) {
      if (i >= lengths[b]!) continue
      blocks[b]!.push(stream[cursor]!)
      cursor += 1
    }
  }

  return blocks.flat()
}

/** Parses a byte-mode segment out of the data codewords. */
export function decodeMatrix(matrix: QrMatrix): string {
  const data = deinterleave(matrix, readCodewords(matrix))

  const bits: number[] = []
  for (const byte of data) {
    for (let i = 7; i >= 0; i -= 1) bits.push((byte >>> i) & 1)
  }

  let cursor = 0
  const take = (width: number): number => {
    let value = 0
    for (let i = 0; i < width; i += 1) value = (value << 1) | bits[cursor + i]!
    cursor += width
    return value
  }

  const mode = take(4)
  if (mode !== 0b0100) throw new Error(`expected byte mode, read ${mode}`)

  const length = take(matrix.version >= 10 ? 16 : 8)
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i += 1) bytes[i] = take(8)

  return new TextDecoder().decode(bytes)
}

/**
 * Both copies of the 15-bit format string, read independently.
 *
 * The test compares them against each other and against the expected value, so
 * a symbol where only one corner is right does not pass.
 */
export function readFormatCopies(matrix: QrMatrix): [number, number] {
  const { modules, size } = matrix
  const dark = (row: number, col: number) => (modules[row]![col] === true ? 1 : 0)

  let first = 0
  for (let i = 0; i <= 5; i += 1) first |= dark(i, 8) << i
  first |= dark(7, 8) << 6
  first |= dark(8, 8) << 7
  first |= dark(8, 7) << 8
  for (let i = 9; i < 15; i += 1) first |= dark(8, 14 - i) << i

  let second = 0
  for (let i = 0; i < 8; i += 1) second |= dark(8, size - 1 - i) << i
  for (let i = 8; i < 15; i += 1) second |= dark(size - 15 + i, 8) << i

  return [first, second]
}
