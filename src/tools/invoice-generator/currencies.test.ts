import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  CURRENCIES,
  DEFAULT_CURRENCY_CODE,
  formatAmount,
  formatMoney,
  getCurrency,
} from '@/tools/invoice-generator/currencies'

const NGN = getCurrency('NGN')
const USD = getCurrency('USD')
const JPY = getCurrency('JPY')

describe('the currency list', () => {
  test('covers the required set', () => {
    const required = [
      'NGN', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'ZAR', 'GHS', 'KES',
      'UGX', 'TZS', 'INR', 'AED', 'SAR', 'JPY', 'CNY',
    ]
    for (const code of required) {
      assert.ok(
        CURRENCIES.some((c) => c.code === code),
        `${code} is missing from the currency list`,
      )
    }
  })

  test('every entry is complete', () => {
    for (const currency of CURRENCIES) {
      assert.match(currency.code, /^[A-Z]{3}$/, `${currency.code} is not an ISO 4217 code`)
      assert.ok(currency.name.length > 0, `${currency.code} has no name`)
      assert.ok(currency.symbol.length > 0, `${currency.code} has no symbol`)
      assert.ok(
        currency.decimals === 0 || currency.decimals === 2,
        `${currency.code} has odd minor units`,
      )
    }
  })

  test('codes are unique', () => {
    const codes = CURRENCIES.map((c) => c.code)
    assert.equal(new Set(codes).size, codes.length)
  })

  test('the default exists and is first, so the picker opens on it', () => {
    assert.equal(CURRENCIES[0]?.code, DEFAULT_CURRENCY_CODE)
  })

  test('an unknown code falls back rather than throwing', () => {
    // A blank invoice is a worse failure than a wrong symbol.
    assert.equal(getCurrency('XXX').code, DEFAULT_CURRENCY_CODE)
    assert.equal(getCurrency('').code, DEFAULT_CURRENCY_CODE)
  })
})

describe('formatting money', () => {
  test('groups thousands and keeps two decimals', () => {
    assert.equal(formatMoney(250000, NGN), '₦250,000.00')
    assert.equal(formatMoney(300000, NGN), '₦300,000.00')
    assert.equal(formatMoney(1234567.89, USD), '$1,234,567.89')
  })

  test('small amounts are not grouped', () => {
    assert.equal(formatMoney(0, NGN), '₦0.00')
    assert.equal(formatMoney(5, NGN), '₦5.00')
    assert.equal(formatMoney(999.5, NGN), '₦999.50')
  })

  test('zero-decimal currencies show no decimals', () => {
    assert.equal(formatMoney(1000, JPY), '¥1,000')
    assert.equal(formatMoney(1000.4, JPY), '¥1,000')
  })

  test('multi-byte symbols survive formatting intact', () => {
    // These are the symbols that broke pdf-lib's standard fonts, which is why
    // the invoice is printed by the browser instead. They must at least be
    // handled correctly in the app itself.
    assert.equal(formatMoney(150000, getCurrency('NGN')), '₦150,000.00')
    assert.equal(formatMoney(1500, getCurrency('GHS')), '₵1,500.00')
    assert.equal(formatMoney(1500, getCurrency('INR')), '₹1,500.00')
    assert.equal(formatMoney(1500, getCurrency('AED')), 'د.إ1,500.00')
    assert.equal(formatMoney(1500, getCurrency('SAR')), 'ر.س1,500.00')
    assert.equal(formatMoney(1500, getCurrency('EUR')), '€1,500.00')
    assert.equal(formatMoney(1500, getCurrency('GBP')), '£1,500.00')
  })

  test('negatives put the sign before the symbol', () => {
    assert.equal(formatMoney(-2500, USD), '-$2,500.00')
  })

  test('non-finite input renders as zero, never as "NaN" on a document', () => {
    assert.equal(formatMoney(Number.NaN, NGN), '₦0.00')
    assert.equal(formatMoney(Number.POSITIVE_INFINITY, NGN), '₦0.00')
    assert.equal(formatMoney(Number.NEGATIVE_INFINITY, NGN), '₦0.00')
  })

  test('every currency formats without throwing on its own symbol', () => {
    for (const currency of CURRENCIES) {
      // 1234.4 rather than .5, so zero-decimal currencies do not round up past
      // the grouped digits being asserted.
      const out = formatMoney(1234.4, currency)
      assert.ok(out.includes(currency.symbol), `${currency.code} lost its symbol`)
      assert.ok(out.includes('1,234'), `${currency.code} did not group: ${out}`)
      assert.ok(!out.includes('NaN'), `${currency.code} produced NaN`)
    }
  })

  test('formatAmount drops the symbol for symbol-headed columns', () => {
    assert.equal(formatAmount(250000, NGN), '250,000.00')
    assert.equal(formatAmount(-2500, USD), '-2,500.00')
  })

  test('switching currency relabels the amount and does not convert it', () => {
    // The whole point of having no exchange-rate API: 250000 is 250000 in both.
    assert.equal(formatMoney(250000, NGN), '₦250,000.00')
    assert.equal(formatMoney(250000, USD), '$250,000.00')
    assert.equal(formatAmount(250000, NGN), formatAmount(250000, USD))
  })

  test('output is deterministic, not locale-dependent', () => {
    // Intl.NumberFormat would pick separators from the host locale, so the same
    // invoice would print differently on two machines. This must not.
    assert.equal(formatMoney(1234567.89, USD), '$1,234,567.89')
    assert.ok(!formatMoney(1234567.89, USD).includes(' '))
  })
})
