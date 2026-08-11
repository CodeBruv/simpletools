import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { calculateInvoice } from './calculateInvoice'
import { formatMoney, getCurrency } from './currencies'
import { createInvoice, createLineItem } from './invoiceDefaults'
import type { InvoiceData } from './types'

/**
 * The manual acceptance walkthrough, executed.
 *
 * These are the exact figures a person is asked to check by hand in a browser.
 * Pinning them here means the numbers quoted in the hand-off checklist come from
 * the real engine rather than from someone's arithmetic, and that a later change
 * to rounding, ordering or formatting fails a test instead of quietly changing
 * what a customer is billed.
 *
 * Fixed clock: the defaults derive the dates from "now", and a test that depends
 * on the day it runs is a test that fails on a Tuesday.
 */
const NOW = new Date('2026-08-11T09:00:00')
const NGN = getCurrency('NGN')

/** Step 1 of the walkthrough: one seller, one customer, one line. */
function singleItemInvoice(): InvoiceData {
  const base = createInvoice(NOW)

  return {
    ...base,
    seller: { ...base.seller, name: 'Code Bruv Technologies', email: 'hello@example.com' },
    customer: { ...base.customer, name: 'John Doe' },
    items: [
      { ...createLineItem(), description: 'Website Design', quantity: '1', unitPrice: '150000' },
    ],
  }
}

/** Step 2: a second line at a quantity above one. */
function twoItemInvoice(): InvoiceData {
  const one = singleItemInvoice()

  return {
    ...one,
    items: [
      ...one.items,
      { ...createLineItem(), description: 'Domain & Hosting', quantity: '2', unitPrice: '25000' },
    ],
  }
}

/** Step 3: the same invoice with a flat discount and a percentage tax. */
function discountedTaxedInvoice(): InvoiceData {
  return { ...twoItemInvoice(), discount: '10000', taxRate: '7.5', taxLabel: 'VAT' }
}

describe('acceptance walkthrough — a fresh invoice', () => {
  test('opens on INV-0001 in naira with one editable row', () => {
    const fresh = createInvoice(NOW)

    assert.equal(fresh.invoiceNumber, 'INV-0001')
    assert.equal(fresh.currencyCode, 'NGN')
    assert.equal(fresh.items.length, 1)
    assert.equal(fresh.items[0]?.quantity, '1')
  })

  test('dates default to today and a fortnight out, in local time', () => {
    const fresh = createInvoice(NOW)

    assert.equal(fresh.issueDate, '2026-08-11')
    assert.equal(fresh.dueDate, '2026-08-25')
  })

  test('an untouched invoice totals zero rather than NaN', () => {
    const totals = calculateInvoice(createInvoice(NOW))

    assert.equal(totals.subtotal, 0)
    assert.equal(totals.total, 0)
    assert.equal(formatMoney(totals.total, NGN), '₦0.00')
  })
})

describe('acceptance walkthrough — Website Design, 1 × 150000', () => {
  test('subtotal is ₦150,000.00', () => {
    const totals = calculateInvoice(singleItemInvoice())

    assert.equal(totals.subtotal, 150000)
    assert.equal(formatMoney(totals.subtotal, NGN), '₦150,000.00')
  })

  test('with no discount and no tax, the total equals the subtotal', () => {
    const totals = calculateInvoice(singleItemInvoice())

    assert.equal(totals.discountAmount, 0)
    assert.equal(totals.taxAmount, 0)
    assert.equal(totals.total, 150000)
    assert.equal(formatMoney(totals.total, NGN), '₦150,000.00')
  })
})

describe('acceptance walkthrough — plus Domain & Hosting, 2 × 25000', () => {
  test('the second line multiplies out to ₦50,000.00', () => {
    const totals = calculateInvoice(twoItemInvoice())

    assert.deepEqual(totals.lineTotals, [150000, 50000])
    assert.equal(formatMoney(totals.lineTotals[1] ?? 0, NGN), '₦50,000.00')
  })

  test('subtotal is ₦200,000.00', () => {
    const totals = calculateInvoice(twoItemInvoice())

    assert.equal(totals.subtotal, 200000)
    assert.equal(formatMoney(totals.subtotal, NGN), '₦200,000.00')
  })
})

describe('acceptance walkthrough — ₦10,000 off and 7.5% VAT', () => {
  test('tax applies after the discount, not before', () => {
    const totals = calculateInvoice(discountedTaxedInvoice())

    assert.equal(totals.subtotal, 200000)
    assert.equal(totals.discountAmount, 10000)
    assert.equal(totals.taxableAmount, 190000)
    // 7.5% of 190,000 — not of 200,000, which would be 15,000.
    assert.equal(totals.taxAmount, 14250)
  })

  test('the total is ₦204,250.00', () => {
    const totals = calculateInvoice(discountedTaxedInvoice())

    assert.equal(totals.total, 204250)
    assert.equal(formatMoney(totals.total, NGN), '₦204,250.00')
  })

  test('the printed figures reconcile: subtotal − discount + tax = total', () => {
    const totals = calculateInvoice(discountedTaxedInvoice())

    assert.equal(totals.subtotal - totals.discountAmount + totals.taxAmount, totals.total)
  })
})

describe('acceptance walkthrough — switching currency', () => {  // The claim under test is the one printed on the page: changing currency
  // relabels the money and never converts it. If a rate ever crept in, every
  // assertion below would move.
  const EXPECTED = [
    ['NGN', '₦204,250.00'],
    ['USD', '$204,250.00'],
    ['EUR', '€204,250.00'],
    ['GBP', '£204,250.00'],
  ] as const

  for (const [code, expected] of EXPECTED) {
    test(`${code} renders ${expected}`, () => {
      const totals = calculateInvoice({ ...discountedTaxedInvoice(), currencyCode: code })

      assert.equal(totals.total, 204250, `${code} changed the amount`)
      assert.equal(formatMoney(totals.total, getCurrency(code)), expected)
    })
  }

  test('the numeric part is identical across all four', () => {
    const rendered = EXPECTED.map(([code]) => {
      const currency = getCurrency(code)
      return formatMoney(204250, currency).replace(currency.symbol, '')
    })

    assert.deepEqual(new Set(rendered), new Set(['204,250.00']))
  })
})
