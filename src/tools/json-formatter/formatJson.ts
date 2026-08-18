export type JsonIndentation = 2 | 4 | '\t'
export type JsonOperation = 'format' | 'minify' | 'validate'

export interface JsonError {
  message: string
  position?: number
  line?: number
  column?: number
}

export interface JsonOperationResult {
  ok: boolean
  output?: string
  error?: JsonError
}

const POSITION_PATTERN = /(?:position|at position)\s+(\d+)/i
const LINE_COLUMN_PATTERN = /line\s+(\d+)\s*(?:,|and)?\s*column\s+(\d+)/i

/**
 * Runs one explicit JSON operation using the browser's native parser and
 * serializer. No work is performed while the user is typing.
 */
export function processJson(
  input: string,
  operation: JsonOperation,
  indentation: JsonIndentation = 2,
): JsonOperationResult {
  if (!input.trim()) {
    return { ok: false, error: { message: 'Enter JSON to process.' } }
  }

  try {
    const value: unknown = JSON.parse(input)

    if (operation === 'validate') return { ok: true }

    return {
      ok: true,
      output: JSON.stringify(value, null, operation === 'minify' ? 0 : indentation),
    }
  } catch (error) {
    return { ok: false, error: describeJsonError(error) }
  }
}

export function describeJsonError(error: unknown): JsonError {
  const rawMessage = error instanceof SyntaxError ? error.message : ''
  const position = extractNumber(rawMessage, POSITION_PATTERN)
  const lineColumn = rawMessage.match(LINE_COLUMN_PATTERN)

  return {
    message: cleanParserMessage(rawMessage),
    ...(position === undefined ? {} : { position }),
    ...(lineColumn
      ? { line: Number(lineColumn[1]), column: Number(lineColumn[2]) }
      : {}),
  }
}

function extractNumber(message: string, pattern: RegExp): number | undefined {
  const match = message.match(pattern)
  if (!match?.[1]) return undefined
  const value = Number(match[1])
  return Number.isSafeInteger(value) ? value : undefined
}

function cleanParserMessage(message: string): string {
  if (!message) return 'The JSON syntax is not valid.'

  const cleaned = message
    .replace(/^SyntaxError:\s*/i, '')
    .replace(/\s+at position\s+\d+(?:\s*\(line\s+\d+\s+column\s+\d+\))?/i, '')
    .replace(/\s+in JSON at position\s+\d+/i, '')
    .replace(/\s+at line\s+\d+\s*(?:,|and)?\s*column\s+\d+/i, '')
    .trim()

  return cleaned || 'The JSON syntax is not valid.'
}

export function formatJsonError(error: JsonError): string {
  const location =
    error.line !== undefined && error.column !== undefined
      ? `Line ${error.line}, column ${error.column}.`
      : error.position !== undefined
        ? `Near position ${error.position}.`
        : ''

  return [error.message, location].filter(Boolean).join(' ')
}
