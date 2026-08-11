import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  MAX_TARGET_MARGIN,
  formatPercent,
  fromCostAndPrice,
  fromTargetMargin,
  fromTargetProfit,
  isAchievableMargin,
  marginOf,
  markupOf,
  roundMoney,
} from '@/tools/profit-margin/calculateMargin'

/**
 * Margin, markup and profit are the whole product here — there is no output to
 * eyeball, so every number this tool shows is checked against arithmetic worked
 * out independently of the implementation.
 *
 * `TWO_THIRDS_PERCENT` is 200/3, the exact markup on a 60,000 cost sold at
 * 100,000. It repeats forever, so it is compared with a tolerance and its
 * displayed form is asserted separately.
 */
const TWO_THIRDS_PERCENT = 200 / 3

function assertClose(actual: number | null, expected: number, message: string) {
  assert.ok(actual !== null, `${message}: expected a number, got null`)
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${message}: expected ~${expected}, got ${actual}`,
  )
}

describe('fromCostAndPrice', () => {
  test('the headline case: 60,000 cost sold at 100,000', () => {
    const figures = fromCostAndPrice(60000, 100000, 2)

    assert.equal(figures.profit, 40000)
    assert.equal(figures.margin, 40)
    assertClose(figures.markup, TWO_THIRDS_PERCENT, 'markup')

    // The distinction the whole UI exists to make: same trade, two numbers.
    assert.notEqual(figures.margin, figures.markup)
    assert.equal(formatPercent(figures.margin ?? 0), '40%')
    assert.equal(formatPercent(figures.markup ?? 0), '66.67%')
  })

  test('a price below cost is a loss, not an invalid calculation', () => {
    const figures = fromCostAndPrice(100000, 80000, 2)

    assert.equal(figures.profit, -20000)
    assert.equal(figures.margin, -25)
    assert.equal(figures.markup, -20)
  })

  test('nothing is clamped to zero on the way out', () => {
    const figures = fromCostAndPrice(500, 1, 2)

    assert.ok(figures.profit < 0, 'profit stays negative')
    assert.ok((figures.margin ?? 0) < 0, 'margin stays negative')
    assert.ok((figures.markup ?? 0) < 0, 'markup stays negative')
  })

  test('breaking even reads as zero across the board', () => {
    const figures = fromCostAndPrice(100000, 100000, 2)

    assert.equal(figures.profit, 0)
    assert.equal(figures.margin, 0)
    assert.equal(figures.markup, 0)
  })

  test('a zero selling price has no margin, because there is no revenue to share', () => {
    const figures = fromCostAndPrice(60000, 0, 2)

    assert.equal(figures.profit, -60000)
    assert.equal(figures.margin, null)
    // Losing the entire cost is exactly -100% markup, which is a real answer.
    assert.equal(figures.markup, -100)
  })

  test('a zero cost has no markup, because there is nothing to mark up', () => {
    const figures = fromCostAndPrice(0, 100000, 2)

    assert.equal(figures.profit, 100000)
    assert.equal(figures.margin, 100)
    assert.equal(figures.markup, null)
  })

  test('zero cost and zero price produce no percentages at all', () => {
    const figures = fromCostAndPrice(0, 0, 2)

    assert.equal(figures.profit, 0)
    assert.equal(figures.margin, null)
    assert.equal(figures.markup, null)
  })

  test('no result is ever NaN or Infinity', () => {
    const awkward: readonly [number, number][] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1e12, 1e12 + 1],
      [0.01, 0.02],
      [Number.MAX_SAFE_INTEGER, 1],
    ]

    for (const [cost, price] of awkward) {
      const figures = fromCostAndPrice(cost, price, 2)

      for (const [key, value] of Object.entries(figures)) {
        if (value === null) continue
        assert.ok(
          Number.isFinite(value),
          `${key} was ${String(value)} for cost ${cost} price ${price}`,
        )
      }
    }
  })

  test('money is kept to the currency precision, so displayed values agree', () => {
    // 19.99 - 10 is 9.989999999999998 in binary floating point.
    const cents = fromCostAndPrice(10, 19.99, 2)
    assert.equal(cents.profit, 9.99)

    // A zero-decimal currency has no fractional prices to report.
    const yen = fromCostAndPrice(1200.4, 1999.6, 0)
    assert.equal(yen.cost, 1200)
    assert.equal(yen.price, 2000)
    assert.equal(yen.profit, 800)
  })

  test('very small and very large amounts both survive', () => {
    const small = fromCostAndPrice(0.01, 0.02, 2)
    assert.equal(small.profit, 0.01)
    assert.equal(small.margin, 50)
    assert.equal(small.markup, 100)

    const large = fromCostAndPrice(1_000_000_000, 2_000_000_000, 2)
    assert.equal(large.profit, 1_000_000_000)
    assert.equal(large.margin, 50)
    assert.equal(large.markup, 100)
  })
})

describe('marginOf and markupOf', () => {
  test('margin divides by price, markup divides by cost', () => {
    assert.equal(marginOf(40000, 100000), 40)
    assertClose(markupOf(40000, 60000), TWO_THIRDS_PERCENT, 'markup')
  })

  test('a zero denominator returns null rather than Infinity', () => {
    assert.equal(marginOf(40000, 0), null)
    assert.equal(markupOf(40000, 0), null)
    assert.equal(marginOf(0, 0), null)
    assert.equal(markupOf(0, 0), null)
  })
})

describe('fromTargetMargin', () => {
  test('40% on a 60,000 cost needs a price of exactly 100,000', () => {
    const figures = fromTargetMargin(60000, 40, 2)

    assert.equal(figures.price, 100000)
    assert.equal(figures.profit, 40000)
    assert.equal(figures.margin, 40)
    assertClose(figures.markup, TWO_THIRDS_PERCENT, 'markup')
  })

  test('a 0% margin means selling at cost', () => {
    const figures = fromTargetMargin(60000, 0, 2)

    assert.equal(figures.price, 60000)
    assert.equal(figures.profit, 0)
    assert.equal(figures.margin, 0)
    assert.equal(figures.markup, 0)
  })

  test('a margin just below 100% gives a large but finite price', () => {
    const figures = fromTargetMargin(100, 99.99, 2)

    assert.equal(figures.price, 1000000)
    assert.ok(Number.isFinite(figures.price))
    assertClose(figures.margin, 99.99, 'margin')
  })

  test('the reported margin belongs to the price actually quoted', () => {
    // 10 / 0.67 is 14.9253…, which as money is 14.93 — and at 14.93 the margin
    // really is 33.02%, not the 33% that was asked for.
    const figures = fromTargetMargin(10, 33, 2)

    assert.equal(figures.price, 14.93)
    assert.equal(figures.profit, 4.93)
    assert.equal(formatPercent(figures.margin ?? 0), '33.02%')

    // Whatever rounding did, the three figures still describe one real sale.
    assert.equal(figures.price - figures.cost, figures.profit)
    assertClose(figures.margin, (figures.profit / figures.price) * 100, 'margin')
  })

  test('100% and above are refused rather than divided by zero', () => {
    assert.equal(isAchievableMargin(MAX_TARGET_MARGIN), false)
    assert.equal(isAchievableMargin(150), false)
    assert.equal(isAchievableMargin(-1), false)
    assert.equal(isAchievableMargin(0), true)
    assert.equal(isAchievableMargin(99.999), true)

    // The guard also holds if some future caller skips validation: no Infinity,
    // no NaN and no negative price escapes.
    for (const impossible of [100, 100.5, 250, -20]) {
      const figures = fromTargetMargin(60000, impossible, 2)
      assert.ok(Number.isFinite(figures.price), `price for ${impossible}`)
      assert.ok(figures.price >= 0, `price for ${impossible} is not negative`)
    }
  })
})

describe('fromTargetProfit', () => {
  test('40,000 profit on a 60,000 cost needs a price of 100,000', () => {
    const figures = fromTargetProfit(60000, 40000, 2)

    assert.equal(figures.price, 100000)
    assert.equal(figures.profit, 40000)
    assert.equal(figures.margin, 40)
    assertClose(figures.markup, TWO_THIRDS_PERCENT, 'markup')
  })

  test('asking for no profit prices at cost', () => {
    const figures = fromTargetProfit(60000, 0, 2)

    assert.equal(figures.price, 60000)
    assert.equal(figures.profit, 0)
    assert.equal(figures.margin, 0)
  })

  test('a negative target is honoured as a loss', () => {
    const figures = fromTargetProfit(60000, -20000, 2)

    assert.equal(figures.price, 40000)
    assert.equal(figures.profit, -20000)
    assert.equal(figures.margin, -50)
  })
})

describe('roundMoney', () => {
  test('rounds to the currency precision', () => {
    assert.equal(roundMoney(9.989999999999998, 2), 9.99)
    assert.equal(roundMoney(1200.4, 0), 1200)
    assert.equal(roundMoney(1999.6, 0), 2000)
  })

  test('the epsilon nudge keeps a boundary value from falling short', () => {
    // Math.round(1.005 * 100) / 100 is 1 without the nudge, because 1.005 is
    // stored as 1.00499999999999989.
    assert.equal(roundMoney(1.005, 2), 1.01)
  })

  test('the nudge is too small to move an ordinary value', () => {
    assert.equal(roundMoney(2.34, 2), 2.34)
    assert.equal(roundMoney(0.005, 2), 0.01)
    assert.equal(roundMoney(1_000_000.555, 2), 1_000_000.56)
    assert.equal(roundMoney(60000, 2), 60000)
  })

  test('non-finite input collapses to zero instead of propagating', () => {
    assert.equal(roundMoney(Number.NaN, 2), 0)
    assert.equal(roundMoney(Number.POSITIVE_INFINITY, 2), 0)
    assert.equal(roundMoney(Number.NEGATIVE_INFINITY, 2), 0)
  })
})

describe('formatPercent', () => {
  test('drops noise but keeps the places that matter', () => {
    assert.equal(formatPercent(40), '40%')
    assert.equal(formatPercent(TWO_THIRDS_PERCENT), '66.67%')
    assert.equal(formatPercent(33.333333), '33.33%')
    assert.equal(formatPercent(66.7), '66.7%')
    assert.equal(formatPercent(100), '100%')
  })

  test('a loss keeps its sign, written the same way as negative money', () => {
    assert.equal(formatPercent(-25), '-25%')
    assert.equal(formatPercent(-33.333333), '-33.33%')
  })

  test('zero never prints as a negative zero', () => {
    assert.equal(formatPercent(0), '0%')
    assert.equal(formatPercent(-0), '0%')
    assert.equal(formatPercent(-0.0001), '0%')
  })

  test('non-finite input cannot reach the screen', () => {
    assert.equal(formatPercent(Number.NaN), '0%')
    assert.equal(formatPercent(Number.POSITIVE_INFINITY), '0%')
  })
})
