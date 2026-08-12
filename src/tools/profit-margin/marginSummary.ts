import { type Currency, formatMoney } from '@/tools/invoice-generator/currencies'

import { formatPercent } from './calculateMargin'
import type { MarginField, MarginFigures, MarginMode } from './types'

/**
 * The words the result panel says.
 *
 * Kept out of the component so the sentences a user reads can be tested like
 * anything else. Three numbers on their own do not teach anybody the difference
 * between margin and markup; the sentence beside them does.
 */

/** Written once, so both halves of the panel and the FAQ cannot drift apart. */
export const MARGIN_VS_MARKUP =
  'Margin is profit as a percentage of your selling price. Markup is profit as a percentage of your cost.'

const FIELD_NAMES: Record<MarginField, string> = {
  cost: 'cost',
  price: 'selling price',
  targetMargin: 'margin you want',
  targetProfit: 'profit you want',
}

/** "Profit", "Loss" or "Break-even" — so the sign is never the only signal. */
export function profitLabel(profit: number): string {
  if (profit > 0) return 'Profit'
  if (profit < 0) return 'Loss'
  return 'Break-even'
}

/** What to say while a required field is still empty. */
export function waitingMessage(missing: readonly MarginField[]): string {
  const names = missing.map((field) => FIELD_NAMES[field])
  if (names.length === 0) return ''

  const last = names[names.length - 1] ?? ''
  const list = names.length === 1 ? last : `${names.slice(0, -1).join(', ')} and ${last}`

  return `Enter the ${list} to see your numbers.`
}

/**
 * The one-sentence version of the answer.
 *
 * A loss is described with the amount unsigned — "You lose ₦20,000" — because
 * "you lose -₦20,000" says the opposite of what it means. The sign stays on the
 * headline figure, where it belongs.
 */
export function plainSummary(figures: MarginFigures, currency: Currency): string {
  const cost = formatMoney(figures.cost, currency)
  const price = formatMoney(figures.price, currency)

  if (figures.profit > 0) {
    const profit = formatMoney(figures.profit, currency)
    return `You make ${profit} after covering the ${cost} cost on a ${price} sale.`
  }

  if (figures.profit < 0) {
    const shortfall = formatMoney(Math.abs(figures.profit), currency)
    return `You lose ${shortfall} — a ${price} sale does not cover the ${cost} cost.`
  }

  return `You break even — a ${price} sale exactly covers the ${cost} cost.`
}

export interface MarginRow {
  label: string
  value: string
  /** Shown when there is no number to show, explaining why rather than printing 0. */
  note?: string
}

function percentRow(label: string, value: number | null, whenMissing: string): MarginRow {
  if (value === null) return { label, value: '—', note: whenMissing }
  return { label, value: formatPercent(value) }
}

const NO_MARGIN = 'Needs a selling price above zero.'
const NO_MARKUP = 'Needs a cost above zero.'

/**
 * The headline answers the question that was asked.
 *
 * Someone who typed a cost and a price wants the profit. Someone who asked what
 * to charge wants the price, and would have to hunt for it if profit led.
 */
export function headlineFor(
  mode: MarginMode,
  figures: MarginFigures,
  currency: Currency,
): MarginRow {
  if (mode === 'from-price') {
    return { label: profitLabel(figures.profit), value: formatMoney(figures.profit, currency) }
  }

  return { label: 'Sell at', value: formatMoney(figures.price, currency) }
}

/** The supporting figures, whichever question was asked. */
export function rowsFor(
  mode: MarginMode,
  figures: MarginFigures,
  currency: Currency,
): readonly MarginRow[] {
  const percentages = [
    percentRow('Profit margin', figures.margin, NO_MARGIN),
    percentRow('Markup', figures.markup, NO_MARKUP),
  ]

  if (mode === 'from-price') return percentages

  // The target modes led with the price, so the profit moves into the rows.
  return [
    { label: profitLabel(figures.profit), value: formatMoney(figures.profit, currency) },
    ...percentages,
  ]
}

/**
 * One line for a screen reader, built from the same rows that are on screen so
 * the two cannot say different things.
 */
export function spokenSummary(
  mode: MarginMode,
  figures: MarginFigures,
  currency: Currency,
): string {
  const headline = headlineFor(mode, figures, currency)
  const parts = [headline, ...rowsFor(mode, figures, currency)]

  return parts.map((row) => `${row.label} ${row.value}`).join('. ') + '.'
}

/**
 * The same rows with nothing in them yet.
 *
 * The panel keeps its shape before the first answer arrives, so the result does
 * not shove the page around as it appears, and someone can see what they are
 * about to get.
 */
export function placeholderRows(mode: MarginMode): readonly MarginRow[] {
  const supporting: readonly MarginRow[] = [
    { label: 'Profit', value: '—' },
    { label: 'Profit margin', value: '—' },
    { label: 'Markup', value: '—' },
  ]

  if (mode === 'from-price') return supporting
  return [{ label: 'Sell at', value: '—' }, ...supporting]
}
