import type { InvoiceData, InvoiceTotals, LineItem } from './types'

/**
 * The invoice arithmetic, kept pure and away from React so it can be tested
 * directly and so a total can never depend on render order.
 */

/**
 * Reads a number out of a text field.
 *
 * Every failure mode collapses to the fallback rather than propagating: an
 * empty field, a half-typed "12.", "abc", Infinity and NaN all have to behave
 * like a number the user has not supplied yet, because the alternative is
 * printing "NaN" on a document someone is about to send a customer.
 */
export function parseAmount(raw: string, fallback = 0): number {
  const trimmed = raw.trim()
  if (trimmed === '') return fallback
  const value = Number(trimmed)
  if (!Number.isFinite(value)) return fallback
  return value
}

/** Negative money is not a thing this tool represents; a credit note is a different document. */
function nonNegative(value: number): number {
  return value > 0 ? value : 0
}

/**
 * Tax is a percentage, clamped to 0–100. A negative rate would hand money back
 * and a rate above 100 is always a typo, not an intention.
 */
function taxPercent(raw: string): number {
  const value = parseAmount(raw)
  if (value <= 0) return 0
  return value > 100 ? 100 : value
}

/**
 * Rounds to whole minor units (cents, kobo).
 *
 * The epsilon nudge is what keeps 0.1 + 0.2 style artefacts off the page:
 * without it 1.005 rounds down, because in binary it is really 1.00499…, and
 * the printed total ends a penny short of the sum of its own lines.
 */
function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * The quantity and unit price as the arithmetic sees them.
 *
 * The document displays these two columns beside the amount it computes from
 * them, so it has to read them the same way. Formatting the raw strings instead
 * would let a printed invoice show a unit price of -5.00 against an amount of
 * 0.00 — two numbers that disagree, on the copy the customer keeps.
 */
export function itemQuantity(item: LineItem): number {
  return nonNegative(parseAmount(item.quantity))
}

export function itemUnitPrice(item: LineItem): number {
  return nonNegative(parseAmount(item.unitPrice))
}

export function lineTotal(item: LineItem): number {
  return round(itemQuantity(item) * itemUnitPrice(item))
}

export function calculateInvoice(invoice: InvoiceData): InvoiceTotals {
  const lineTotals = invoice.items.map(lineTotal)

  const subtotal = round(lineTotals.reduce((sum, value) => sum + value, 0))

  // A discount larger than the subtotal zeroes the invoice rather than going
  // negative: an invoice that owes the customer money is a credit note, which
  // is a different document this tool does not claim to produce.
  const requestedDiscount = nonNegative(parseAmount(invoice.discount))
  const discountAmount = round(Math.min(requestedDiscount, subtotal))

  const taxableAmount = round(Math.max(0, subtotal - discountAmount))
  const taxAmount = round((taxableAmount * taxPercent(invoice.taxRate)) / 100)
  const total = round(Math.max(0, taxableAmount + taxAmount))

  return { lineTotals, subtotal, discountAmount, taxableAmount, taxAmount, total }
}
