import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { createInvoice, createLineItem } from '@/tools/invoice-generator/invoiceDefaults'
import { isReadyToSend, validateInvoice } from '@/tools/invoice-generator/validateInvoice'
import type { InvoiceData } from '@/tools/invoice-generator/types'

/** A complete, ordinary invoice with nothing optional filled in. */
function filled(patch: Partial<InvoiceData> = {}): InvoiceData {
  const base = createInvoice(new Date(2026, 0, 15))
  return {
    ...base,
    seller: { ...base.seller, name: 'Code Bruv Technologies' },
    customer: { ...base.customer, name: 'John Doe' },
    items: [{ ...createLineItem(), description: 'Website Design', quantity: '1', unitPrice: '150000' }],
    ...patch,
  }
}

function fields(invoice: InvoiceData): string[] {
  return validateInvoice(invoice).map((issue) => issue.field)
}

describe('invoice validation', () => {
  test('a minimal invoice with the four essentials is ready', () => {
    assert.deepEqual(validateInvoice(filled()), [])
    assert.equal(isReadyToSend(filled()), true)
  })

  test('optional fields can all be omitted', () => {
    // Address, phone, email, website, tax, discount, notes and terms are absent
    // here. Plenty of real invoices carry none of them.
    const invoice = filled()
    assert.equal(invoice.seller.address, '')
    assert.equal(invoice.taxRate, '')
    assert.equal(invoice.discount, '')
    assert.equal(invoice.notes, '')
    assert.equal(isReadyToSend(invoice), true)
  })

  test('a missing business name is reported', () => {
    const invoice = filled()
    assert.deepEqual(fields({ ...invoice, seller: { ...invoice.seller, name: '' } }), ['sellerName'])
  })

  test('a missing customer name is reported', () => {
    const invoice = filled()
    assert.deepEqual(fields({ ...invoice, customer: { ...invoice.customer, name: '' } }), [
      'customerName',
    ])
  })

  test('a missing invoice number is reported', () => {
    assert.deepEqual(fields(filled({ invoiceNumber: '' })), ['invoiceNumber'])
  })

  test('whitespace does not satisfy a required field', () => {
    const invoice = filled()
    assert.deepEqual(fields({ ...invoice, seller: { ...invoice.seller, name: '   ' } }), [
      'sellerName',
    ])
    assert.deepEqual(fields(filled({ invoiceNumber: '  ' })), ['invoiceNumber'])
  })

  test('an invoice with no real items is reported', () => {
    assert.deepEqual(fields(filled({ items: [] })), ['items'])
    // The default blank row does not count as an item.
    assert.deepEqual(fields(filled({ items: [createLineItem()] })), ['items'])
  })

  test('a described item with no price still counts, so a quote can be drafted', () => {
    const item = { ...createLineItem(), description: 'Consulting', quantity: '1', unitPrice: '' }
    assert.deepEqual(fields(filled({ items: [item] })), [])
  })

  test('a priced item with no description counts too', () => {
    const item = { ...createLineItem(), description: '', quantity: '2', unitPrice: '500' }
    assert.deepEqual(fields(filled({ items: [item] })), [])
  })

  test('a brand-new invoice reports every essential, and none of the optional ones', () => {
    const issues = validateInvoice(createInvoice(new Date(2026, 0, 15)))
    // The invoice number has a default, so it is not among them.
    assert.deepEqual(
      issues.map((issue) => issue.field),
      ['sellerName', 'customerName', 'items'],
    )
  })

  test('messages are written for the person filling the form', () => {
    const invoice = createInvoice(new Date(2026, 0, 15))
    for (const issue of validateInvoice({ ...invoice, invoiceNumber: '' })) {
      assert.ok(issue.message.length > 0, `${issue.field} has no message`)
      // A sentence, not a label: starts capitalised and ends in a full stop.
      assert.match(issue.message, /^[A-Z].*\.$/, `${issue.field}: "${issue.message}"`)
      // No internal vocabulary leaking into the UI.
      assert.doesNotMatch(issue.message, /invalid|null|undefined|NaN|field/, issue.field)
    }
  })
})
