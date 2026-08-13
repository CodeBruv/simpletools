import { getCurrency } from '@/tools/invoice-generator/currencies'

import { fromCostAndPrice, fromTargetMargin, fromTargetProfit, isAchievableMargin } from './calculateMargin'
import type { MarginField, MarginInputs, MarginMode, MarginOutcome, MarginProblem } from './types'

/**
 * Turning what the user typed into either an answer or a plain-language reason
 * there isn't one yet.
 *
 * This is the layer that knows about text, currencies and wording;
 * `calculateMargin.ts` stays pure arithmetic and knows about none of it.
 */

/**
 * The naira leads here because it is what most of this tool's users sell in.
 * The catalogue itself is shared with the Invoice Generator and untouched — its
 * own default stays USD, so declaring this tool's preference locally avoids
 * changing a value another tool depends on.
 */
export const DEFAULT_MARGIN_CURRENCY = 'USD'

export const EMPTY_MARGIN_INPUTS: MarginInputs = {
  cost: '',
  price: '',
  targetMargin: '',
  targetProfit: '',
  currencyCode: DEFAULT_MARGIN_CURRENCY,
}

/** Which fields each question needs before it can be answered. */
export const REQUIRED_FIELDS: Record<MarginMode, readonly MarginField[]> = {
  'from-price': ['cost', 'price'],
  'target-margin': ['cost', 'targetMargin'],
  'target-profit': ['cost', 'targetProfit'],
}

/**
 * Thousands separators and any flavour of space are removed before parsing.
 *
 * People paste "100,000" out of a spreadsheet and type it that way by hand, and
 * the product's own formatter prints it that way, so refusing to read it back
 * would be the tool disagreeing with itself. Safe to strip unconditionally
 * because this codebase fixes "," as the thousands separator and "." as the
 * decimal point everywhere, rather than deriving them from the machine's locale.
 * `\s` already covers the non-breaking and narrow no-break spaces that arrive
 * with a copy-paste, so they need no separate mention.
 */
const NOISE = /[,\s]/g

/** Digits with an optional sign and at most one decimal point. No exponents. */
const DECIMAL = /^[+-]?(\d+\.?\d*|\.\d+)$/

export type ReadNumber =
  | { kind: 'blank' }
  | { kind: 'invalid' }
  | { kind: 'value'; value: number }

/**
 * Reads one field.
 *
 * A lone "-", "+" or "." counts as blank rather than invalid: those are states a
 * field passes through on the way to "-20" and flagging them would scold the
 * user mid-keystroke. Exponent notation is rejected deliberately — nobody types
 * "1e5" into a price box, and refusing it is what keeps "1e400" from arriving as
 * Infinity.
 */
export function readNumber(raw: string): ReadNumber {
  const cleaned = raw.replace(NOISE, '')
  if (cleaned === '' || cleaned === '-' || cleaned === '+' || cleaned === '.') return { kind: 'blank' }
  if (!DECIMAL.test(cleaned)) return { kind: 'invalid' }

  const value = Number(cleaned)
  if (!Number.isFinite(value)) return { kind: 'invalid' }

  return { kind: 'value', value }
}

const NOT_A_NUMBER: Record<MarginField, string> = {
  cost: 'Enter the cost as a number, like 60000 or 60,000.',
  price: 'Enter the selling price as a number, like 100000 or 100,000.',
  targetMargin: 'Enter the margin you want as a number, like 40.',
  targetProfit: 'Enter the profit you want as a number, like 40000.',
}

/**
 * Reads every field the current question needs and decides what to show.
 *
 * Three outcomes, in this order of precedence:
 *
 *  - `problem` — something that was actually filled in cannot be used. These
 *    need the user to act, so they win over anything still empty.
 *  - `waiting` — a required field is empty. Not an error; the calculator simply
 *    has nothing to say yet.
 *  - `ready` — the figures.
 */
export function readMarginInputs(inputs: MarginInputs, mode: MarginMode): MarginOutcome {
  const { decimals } = getCurrency(inputs.currencyCode)

  const required = REQUIRED_FIELDS[mode]
  const problems: MarginProblem[] = []
  const missing: MarginField[] = []
  const values = new Map<MarginField, number>()

  for (const field of required) {
    const read = readNumber(inputs[field])

    if (read.kind === 'blank') {
      missing.push(field)
      continue
    }

    if (read.kind === 'invalid') {
      problems.push({ field, message: NOT_A_NUMBER[field] })
      continue
    }

    values.set(field, read.value)
  }

  const cost = values.get('cost')

  if (cost !== undefined && cost < 0) {
    problems.push({ field: 'cost', message: 'A cost cannot be a negative number.' })
  }

  const price = values.get('price')

  if (price !== undefined && price < 0) {
    problems.push({ field: 'price', message: 'A selling price cannot be a negative number.' })
  }

  const targetMargin = values.get('targetMargin')

  if (targetMargin !== undefined && !isAchievableMargin(targetMargin)) {
    problems.push({
      field: 'targetMargin',
      message:
        targetMargin < 0
          ? 'A target margin cannot be a negative number. To check a loss, use the profit question above.'
          : 'Margin has to stay below 100%. At exactly 100% the cost would have to be zero, and above it the profit would be larger than the price itself, so no selling price exists.',
    })
  }

  const targetProfit = values.get('targetProfit')

  if (targetProfit !== undefined && cost !== undefined && cost + targetProfit < 0) {
    problems.push({
      field: 'targetProfit',
      message: 'That loss is larger than the cost, so the selling price would fall below zero.',
    })
  }

  if (problems.length > 0) return { status: 'problem', problems }
  if (missing.length > 0) return { status: 'waiting', missing }

  // Every required field parsed and passed validation, so the reads below are
  // present by construction; the fallbacks keep the types honest without
  // pretending a missing value is possible here.
  const safeCost = cost ?? 0

  if (mode === 'target-margin') {
    return { status: 'ready', figures: fromTargetMargin(safeCost, targetMargin ?? 0, decimals) }
  }

  if (mode === 'target-profit') {
    return { status: 'ready', figures: fromTargetProfit(safeCost, targetProfit ?? 0, decimals) }
  }

  return { status: 'ready', figures: fromCostAndPrice(safeCost, price ?? 0, decimals) }
}

/** The problem attached to one field, if any — used to wire `aria-describedby`. */
export function problemFor(outcome: MarginOutcome, field: MarginField): string | null {
  if (outcome.status !== 'problem') return null
  return outcome.problems.find((problem) => problem.field === field)?.message ?? null
}
