import { DEFAULT_CURRENCY_CODE } from './currencies'
import type { InvoiceData, LineItem } from './types'

/**
 * The invoice a user sees before typing anything.
 *
 * Nothing here is persisted. Every default is recomputed on mount, which is
 * both a privacy property (no invoice survives the tab) and the reason
 * `createInvoice` takes an explicit `now` — a default that reads the clock
 * internally cannot be tested.
 */

/** Days between issue and due date. Short, and the user can change it. */
export const DEFAULT_PAYMENT_WINDOW_DAYS = 14

/**
 * Sequence always starts at 1: without storage there is no honest way to know
 * what the user's last invoice number was, and inventing a higher one would
 * imply a history the tool does not have. Fully editable.
 */
export const DEFAULT_INVOICE_NUMBER = 'INV-0001'

/**
 * Formats a date the way `<input type="date">` requires: yyyy-mm-dd in *local*
 * time. `toISOString()` is deliberately avoided — it converts to UTC first, so
 * anywhere east of Greenwich an evening invoice would be dated tomorrow.
 */
export function toDateInputValue(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Adds days via the date component, so DST transitions cannot shift the result. */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/**
 * Renders an ISO date for the invoice document, e.g. "15 Jan 2026".
 *
 * Built from the string rather than parsed into a Date, because `new
 * Date('2026-01-15')` is treated as UTC midnight and prints as the 14th for
 * anyone west of Greenwich. Month names are fixed rather than locale-derived so
 * the printed document matches what the sender saw.
 */
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatInvoiceDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  // Anything unparseable is echoed back rather than replaced with a guess or a
  // blank, so a hand-typed date still appears on the document.
  if (!match) return iso.trim()

  const [, year, month, day] = match
  const name = MONTHS[Number(month) - 1]
  if (!name) return iso.trim()

  return `${Number(day)} ${name} ${year}`
}

/** Ids only need to be unique within one unsaved invoice, so a counter is enough. */
let nextItemId = 0

export function createLineItem(): LineItem {
  nextItemId += 1
  return { id: `item-${nextItemId}`, description: '', quantity: '1', unitPrice: '' }
}

export function createInvoice(now: Date = new Date()): InvoiceData {
  return {
    invoiceNumber: DEFAULT_INVOICE_NUMBER,
    issueDate: toDateInputValue(now),
    dueDate: toDateInputValue(addDays(now, DEFAULT_PAYMENT_WINDOW_DAYS)),
    currencyCode: DEFAULT_CURRENCY_CODE,
    seller: { name: '', address: '', email: '', phone: '', website: '' },
    customer: { name: '', address: '', email: '', phone: '' },
    // One row exists from the start: an empty items table looks broken, and the
    // first thing every user does is add a line anyway.
    items: [createLineItem()],
    discount: '',
    taxRate: '',
    taxLabel: 'Tax',
    notes: '',
    terms: '',
  }
}
