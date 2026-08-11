import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateInvoice,
  itemQuantity,
  itemUnitPrice,
  lineTotal,
  parseAmount,
} from '@/tools/invoice-generator/calculateInvoice'
import { createInvoice } from '@/tools/invoice-generator/invoiceDefaults'
import type { InvoiceData, LineItem } from '@/tools/invoice-generator/types'

/**
 * The arithmetic is the part of this tool that a user cannot check by looking.
 * A misaligned column is obvious; a total that is 7.5% of the wrong base is not,
 * and it goes out to a customer.
 */

let seq = 0
function item(quantity: string, unitPrice: string, description = 'Item'): LineItem {
  seq += 1
  return { id: `t${seq}`, description, quantity, unitPrice }
}

function invoice(patch: Partial<InvoiceData> = {}): InvoiceData {
  return { ...createInvoice(new Date(2026, 0, 15)), ...patch }
}

describe('parseAmount', () => {  test('reads ordinary numbers', () => {
    assert.equal(parseAmount('250000'), 250000)
    assert.equal(parseAmount('12.5'), 12.5)
    assert.equal(parseAmount('  40  '), 40)
  })

  test('an empty or half-typed field falls back instead of becoming NaN', () => {
    assert.equal(parseAmount(''), 0)
    assert.equal(parseAmount('   '), 0)
    assert.equal(parseAmount('abc'), 0)
    // Number('12.') is 12, which is what a user mid-keystroke means.
    assert.equal(parseAmount('12.'), 12)
  })

  test('Infinity and NaN never escape', () => {
    assert.equal(parseAmount('Infinity'), 0)
    assert.equal(parseAmount('-Infinity'), 0)
    assert.equal(parseAmount('NaN'), 0)
    assert.equal(parseAmount('1e400'), 0)
  })
})

describe('line totals', () => {
  test('quantity times unit price', () => {
    assert.equal(lineTotal(item('3', '1500')), 4500)
  })

  test('fractional quantities work, for hours and part-units', () => {
    assert.equal(lineTotal(item('1.5', '200')), 300)
  })

  test('negative quantity or price is treated as nothing, not as a credit', () => {
    assert.equal(lineTotal(item('-3', '1500')), 0)
    assert.equal(lineTotal(item('3', '-1500')), 0)
  })

  test('an unfilled row contributes zero', () => {
    assert.equal(lineTotal(item('', '')), 0)
  })
})

describe('invoice totals', () => {
  test('one line item', () => {
    const totals = calculateInvoice(invoice({ items: [item('1', '150000')] }))
    assert.equal(totals.subtotal, 150000)
    assert.equal(totals.total, 150000)
  })

  test('subtotal is the sum of the lines', () => {
    const totals = calculateInvoice(invoice({ items: [item('1', '150000'), item('2', '25000')] }))
    assert.deepEqual(totals.lineTotals, [150000, 50000])
    assert.equal(totals.subtotal, 200000)
    assert.equal(totals.total, 200000)
  })

  test('an empty invoice is all zeros, not NaN', () => {
    const totals = calculateInvoice(invoice({ items: [] }))
    assert.equal(totals.subtotal, 0)
    assert.equal(totals.total, 0)
    assert.ok(Object.values(totals).every((v) => Array.isArray(v) || Number.isFinite(v)))
  })

  test('zero quantity and zero price contribute nothing', () => {
    const totals = calculateInvoice(
      invoice({ items: [item('0', '5000'), item('3', '0'), item('1', '1000')] }),
    )
    assert.deepEqual(totals.lineTotals, [0, 0, 1000])
    assert.equal(totals.total, 1000)
  })

  test('a discount comes off the subtotal', () => {
    const totals = calculateInvoice(invoice({ items: [item('1', '200000')], discount: '20000' }))
    assert.equal(totals.discountAmount, 20000)
    assert.equal(totals.taxableAmount, 180000)
    assert.equal(totals.total, 180000)
  })

  test('a discount larger than the subtotal zeroes the invoice, never inverts it', () => {
    const totals = calculateInvoice(invoice({ items: [item('1', '1000')], discount: '5000' }))
    // Clamped to the subtotal, so the document cannot claim a credit.
    assert.equal(totals.discountAmount, 1000)
    assert.equal(totals.taxableAmount, 0)
    assert.equal(totals.total, 0)
  })

  test('tax is a percentage of the subtotal', () => {
    const totals = calculateInvoice(invoice({ items: [item('1', '200000')], taxRate: '7.5' }))
    assert.equal(totals.taxAmount, 15000)
    assert.equal(totals.total, 215000)
  })

  test('tax is charged on the amount after discount, not before', () => {
    const totals = calculateInvoice(
      invoice({ items: [item('1', '200000')], discount: '20000', taxRate: '7.5' }),
    )
    assert.equal(totals.discountAmount, 20000)
    assert.equal(totals.taxableAmount, 180000)
    // 7.5% of 180,000. Taxing the pre-discount 200,000 would give 15,000.
    assert.equal(totals.taxAmount, 13500)
    assert.equal(totals.total, 193500)
  })

  test('tax rates above 100 are clamped', () => {
    const totals = calculateInvoice(invoice({ items: [item('1', '1000')], taxRate: '150' }))
    assert.equal(totals.taxAmount, 1000)
    assert.equal(totals.total, 2000)
  })

  test('negative discount and negative tax are ignored', () => {
    const totals = calculateInvoice(
      invoice({ items: [item('1', '1000')], discount: '-500', taxRate: '-5' }),
    )
    assert.equal(totals.discountAmount, 0)
    assert.equal(totals.taxAmount, 0)
    assert.equal(totals.total, 1000)
  })

  test('garbage in the money fields does not poison the total', () => {
    const totals = calculateInvoice(
      invoice({ items: [item('2', '10')], discount: 'abc', taxRate: 'NaN' }),
    )
    assert.equal(totals.total, 20)
  })

  test('the total is never negative and never non-finite, whatever is typed', () => {
    const nasty = ['', '-1', 'abc', 'NaN', 'Infinity', '-Infinity', '1e400', '999999999']
    for (const discount of nasty) {
      for (const taxRate of nasty) {
        const totals = calculateInvoice(
          invoice({ items: [item('2', '1500'), item('-1', 'x')], discount, taxRate }),
        )
        for (const [key, value] of Object.entries(totals)) {
          if (Array.isArray(value)) continue
          assert.ok(Number.isFinite(value), `${key} not finite for ${discount}/${taxRate}`)
          assert.ok(value >= 0, `${key} negative for ${discount}/${taxRate}`)
        }
      }
    }
  })

  test('no obvious floating-point artefacts', () => {
    // 0.1 + 0.2 territory: three rows that must sum to exactly 0.60.
    const totals = calculateInvoice(
      invoice({ items: [item('1', '0.1'), item('1', '0.2'), item('1', '0.3')] }),
    )
    assert.equal(totals.subtotal, 0.6)
    assert.equal(totals.total, 0.6)
  })

  test('a rate that produces a fraction of a cent is rounded, not left long', () => {
    const totals = calculateInvoice(invoice({ items: [item('3', '33.33')], taxRate: '7.5' }))
    assert.equal(totals.subtotal, 99.99)
    assert.equal(totals.taxAmount, 7.5)
    assert.equal(totals.total, 107.49)
  })

  test('the parts always reconcile with the total', () => {
    const totals = calculateInvoice(
      invoice({
        items: [item('3', '1999.99'), item('7', '45.5'), item('1.5', '1200')],
        discount: '1250.75',
        taxRate: '20',
      }),
    )
    const rebuilt = totals.taxableAmount + totals.taxAmount
    assert.ok(Math.abs(rebuilt - totals.total) < 0.005, `${rebuilt} vs ${totals.total}`)
    assert.equal(totals.subtotal - totals.discountAmount, totals.taxableAmount)
  })
})

describe('the columns the document prints', () => {
  /*
    The invoice shows quantity and unit price next to the amount it derives from
    them. These accessors exist so all three numbers come from one reading of the
    fields: display the raw strings instead and a negative price prints as
    -5.00 beside an amount of 0.00, which looks like a bug in the arithmetic on
    the copy the customer keeps.
  */
  test('ordinary values pass straight through', () => {
    const row = item('2', '25000')
    assert.equal(itemQuantity(row), 2)
    assert.equal(itemUnitPrice(row), 25000)
  })

  test('an empty field reads as zero, not NaN', () => {
    const row = item('', '')
    assert.equal(itemQuantity(row), 0)
    assert.equal(itemUnitPrice(row), 0)
  })

  test('a negative entry is clamped, so nothing negative can print', () => {
    const row = item('-3', '-5')
    assert.equal(itemQuantity(row), 0)
    assert.equal(itemUnitPrice(row), 0)
  })

  test('the accessors and the line total always agree', () => {
    for (const row of [
      item('1', '150000'),
      item('2', '25000'),
      item('1.5', '1200'),
      item('3', '33.33'),
      item('', '99'),
      item('4', ''),
      item('-2', '50'),
      item('abc', 'xyz'),
      item('Infinity', '10'),
    ]) {
      assert.equal(
        lineTotal(row),
        Math.round((itemQuantity(row) * itemUnitPrice(row) + Number.EPSILON) * 100) / 100,
        `${row.quantity} × ${row.unitPrice}`,
      )
    }
  })
})
