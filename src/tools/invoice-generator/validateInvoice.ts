import { lineTotal } from './calculateInvoice'
import type { InvoiceData } from './types'

/**
 * What still needs attention before this invoice is worth sending.
 *
 * Deliberately advisory rather than blocking. The preview renders from the
 * first keystroke, because being able to see the document take shape is what
 * makes the form make sense — so nothing here gates the UI. These messages sit
 * next to the print button and name the gap in plain language, which is the
 * difference between "the tool did nothing" and "I know what to do next".
 */

export type InvoiceField = 'invoiceNumber' | 'sellerName' | 'customerName' | 'items'

export interface InvoiceIssue {
  field: InvoiceField
  /** Written for the person filling the form, not for a developer. */
  message: string
}

/** True when a row would actually appear as a charge on the document. */
function isMeaningfulItem(invoice: InvoiceData): boolean {
  return invoice.items.some((item) => item.description.trim() !== '' || lineTotal(item) > 0)
}

export function validateInvoice(invoice: InvoiceData): readonly InvoiceIssue[] {
  const issues: InvoiceIssue[] = []

  if (invoice.seller.name.trim() === '') {
    issues.push({ field: 'sellerName', message: 'Add your business or your own name.' })
  }

  if (invoice.customer.name.trim() === '') {
    issues.push({ field: 'customerName', message: 'Add the name of the customer you are billing.' })
  }

  if (invoice.invoiceNumber.trim() === '') {
    issues.push({ field: 'invoiceNumber', message: 'Give the invoice a number so it can be referenced later.' })
  }

  if (!isMeaningfulItem(invoice)) {
    issues.push({ field: 'items', message: 'Add at least one item with a description and a price.' })
  }

  return issues
}

/**
 * Only the four essentials above are required. Address, phone, email, website,
 * tax, discount, notes and terms are all genuinely optional — plenty of real
 * invoices carry none of them, and demanding them would be the tool inventing
 * paperwork.
 */
export function isReadyToSend(invoice: InvoiceData): boolean {
  return validateInvoice(invoice).length === 0
}
