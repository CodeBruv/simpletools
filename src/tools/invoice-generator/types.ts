/**
 * Invoice shapes.
 *
 * Numeric fields are held as strings because they come from text inputs. A
 * half-typed "12." or an empty field has to survive in state without becoming
 * NaN and wiping the totals, so parsing happens once, in the calculation
 * engine, rather than on every keystroke in the UI.
 */

/** A single billable row. */
export interface LineItem {
  /** Stable across reorders and deletions, so React keys stay honest. */
  id: string
  description: string
  quantity: string
  unitPrice: string
}

/** Who is sending the invoice, or who is being billed. */
export interface Party {
  name: string
  /** Free-form, multi-line: street, city, country, whatever the sender needs. */
  address: string
  email: string
  phone: string
  /** Seller only. The customer's own site has no place on an invoice. */
  website?: string
}

export interface InvoiceData {
  invoiceNumber: string
  /** ISO yyyy-mm-dd, straight from a date input. */
  issueDate: string
  dueDate: string
  currencyCode: string
  seller: Party
  customer: Party
  items: readonly LineItem[]
  /**
   * An absolute amount off the subtotal, not a percentage. Small invoices are
   * far more often discounted by "take 5,000 off" than by a rate.
   */
  discount: string
  /** A percentage, applied after the discount. */
  taxRate: string
  /** Free text shown under the totals. */
  taxLabel: string
  notes: string
  terms: string
}

/**
 * Computed money, all in major units.
 *
 * Separate from InvoiceData: totals are derived, never stored, so there is no
 * way for a displayed total to drift out of step with the rows above it.
 */
export interface InvoiceTotals {
  lineTotals: readonly number[]
  subtotal: number
  discountAmount: number
  /** Subtotal less discount — what tax is charged on. */
  taxableAmount: number
  taxAmount: number
  total: number
}
