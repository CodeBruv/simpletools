import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { getCurrency } from '@/tools/invoice-generator/currencies'
import {
  fromCostAndPrice,
  fromTargetMargin,
  fromTargetProfit,
  formatPercent,
} from '@/tools/profit-margin/calculateMargin'
import { EMPTY_MARGIN_INPUTS, readMarginInputs } from '@/tools/profit-margin/marginInputs'
import { headlineFor, plainSummary, rowsFor } from '@/tools/profit-margin/marginSummary'
import type { MarginFigures, MarginMode } from '@/tools/profit-margin/types'

/**
 * The manual browser checklist, executed.
 *
 * Every number quoted in the hand-test script for this tool is pinned here, so
 * the checklist cannot quietly describe behaviour the code no longer has. If a
 * line in this file fails, either the checklist is wrong or the calculator is.
 *
 * Figures are asserted the way the panel writes them, because a checklist is
 * read against a screen and not against a float.
 */

const NGN = getCurrency('NGN')
const JPY = getCurrency('JPY')

/** What the result panel would show for these figures. */
function panel(mode: MarginMode, figures: MarginFigures) {
  return {
    headline: headlineFor(mode, figures, NGN),
    rows: rowsFor(mode, figures, NGN),
    sentence: plainSummary(figures, NGN),
  }
}

describe('checklist 1 — basic profit: cost 100,000, price 150,000', () => {
  const figures = fromCostAndPrice(100000, 150000, 2)

  test('profit is ₦50,000.00', () => {
    assert.equal(figures.profit, 50000)
    assert.equal(panel('from-price', figures).headline.value, '₦50,000.00')
  })

  test('margin reads 33.33% and markup reads 50%', () => {
    assert.equal(formatPercent(figures.margin ?? 0), '33.33%')
    assert.equal(formatPercent(figures.markup ?? 0), '50%')
  })

  test('the headline is labelled Profit, so the meaning is not only in colour', () => {
    assert.equal(panel('from-price', figures).headline.label, 'Profit')
  })

  test('the sentence names all three amounts', () => {
    assert.equal(
      panel('from-price', figures).sentence,
      'You make ₦50,000.00 after covering the ₦100,000.00 cost on a ₦150,000.00 sale.',
    )
  })
})

describe('checklist 2 — loss: cost 100,000, price 80,000', () => {
  const figures = fromCostAndPrice(100000, 80000, 2)

  test('profit is -20,000 and is not clamped to zero', () => {
    assert.equal(figures.profit, -20000)
  })

  test('margin is -25% and markup is -20%', () => {
    assert.equal(formatPercent(figures.margin ?? 0), '-25%')
    assert.equal(formatPercent(figures.markup ?? 0), '-20%')
  })

  test('the word Loss carries the meaning, and the prose reads the right way round', () => {
    const shown = panel('from-price', figures)

    assert.equal(shown.headline.label, 'Loss')
    assert.equal(shown.headline.value, '-₦20,000.00')
    assert.equal(
      shown.sentence,
      'You lose ₦20,000.00 — a ₦80,000.00 sale does not cover the ₦100,000.00 cost.',
    )
  })
})

describe('checklist 3 — break-even: cost 100,000, price 100,000', () => {
  const figures = fromCostAndPrice(100000, 100000, 2)

  test('profit, margin and markup are all zero', () => {
    assert.equal(figures.profit, 0)
    assert.equal(formatPercent(figures.margin ?? 0), '0%')
    assert.equal(formatPercent(figures.markup ?? 0), '0%')
  })

  test('it is called Break-even rather than a profit of nothing', () => {
    const shown = panel('from-price', figures)

    assert.equal(shown.headline.label, 'Break-even')
    assert.equal(
      shown.sentence,
      'You break even — a ₦100,000.00 sale exactly covers the ₦100,000.00 cost.',
    )
  })
})

describe('checklist 4 — target margin: cost 60,000 at 40%', () => {
  const figures = fromTargetMargin(60000, 40, 2)

  test('the price to charge is exactly ₦100,000.00', () => {
    assert.equal(figures.price, 100000)
    assert.equal(panel('target-margin', figures).headline.value, '₦100,000.00')
  })

  test('the headline answers the question that was asked', () => {
    assert.equal(panel('target-margin', figures).headline.label, 'Sell at')
  })

  test('profit is ₦40,000.00, margin 40%, markup 66.67%', () => {
    assert.deepEqual(panel('target-margin', figures).rows, [
      { label: 'Profit', value: '₦40,000.00' },
      { label: 'Profit margin', value: '40%' },
      { label: 'Markup', value: '66.67%' },
    ])
  })

  test('a target margin of 100% is refused in words, not as Infinity', () => {
    const outcome = readMarginInputs(
      { ...EMPTY_MARGIN_INPUTS, cost: '100', targetMargin: '100' },
      'target-margin',
    )

    assert.ok(outcome.status === 'problem')
    assert.equal(outcome.problems[0]?.field, 'targetMargin')
    assert.match(outcome.problems[0]?.message ?? '', /below 100%/)
  })
})

describe('checklist 5 — target profit: cost 60,000 plus 40,000', () => {
  const figures = fromTargetProfit(60000, 40000, 2)

  test('the price to charge is ₦100,000.00', () => {
    assert.equal(figures.price, 100000)
    assert.equal(panel('target-profit', figures).headline.value, '₦100,000.00')
  })

  test('it agrees with the target-margin route for the same sale', () => {
    // The same sale reached from two directions must not disagree.
    assert.deepEqual(figures, fromTargetMargin(60000, 40, 2))
  })
})

describe('checklist 6 — zero denominators', () => {
  test('cost 0, price 50,000: margin is 100% and markup is unavailable', () => {
    const figures = fromCostAndPrice(0, 50000, 2)

    assert.equal(figures.profit, 50000)
    assert.equal(formatPercent(figures.margin ?? 0), '100%')
    assert.equal(figures.markup, null)
    assert.deepEqual(panel('from-price', figures).rows, [
      { label: 'Profit margin', value: '100%' },
      { label: 'Markup', value: '—', note: 'Needs a cost above zero.' },
    ])
  })

  test('cost 50,000, price 0: margin is unavailable and markup is -100%', () => {
    const figures = fromCostAndPrice(50000, 0, 2)

    assert.equal(figures.margin, null)
    assert.equal(formatPercent(figures.markup ?? 0), '-100%')
    assert.deepEqual(panel('from-price', figures).rows, [
      { label: 'Profit margin', value: '—', note: 'Needs a selling price above zero.' },
      { label: 'Markup', value: '-100%' },
    ])
  })
})

describe('checklist 7 — decimals: cost 10.50, price 19.99', () => {
  const figures = fromCostAndPrice(10.5, 19.99, 2)

  test('profit is 9.49 with no floating-point tail', () => {
    assert.equal(figures.profit, 9.49)
    assert.equal(panel('from-price', figures).headline.value, '₦9.49')
  })

  test('the percentages are shown to two places', () => {
    assert.equal(formatPercent(figures.margin ?? 0), '47.47%')
    assert.equal(formatPercent(figures.markup ?? 0), '90.38%')
  })
})

describe('checklist 8 — currency is formatting only', () => {
  test('a zero-decimal currency changes the writing, not the arithmetic', () => {
    const figures = fromCostAndPrice(1200.4, 1999.6, 0)

    assert.equal(figures.cost, 1200)
    assert.equal(figures.price, 2000)
    assert.equal(figures.profit, 800)
    assert.equal(headlineFor('from-price', figures, JPY).value, '¥800')
    assert.equal(formatPercent(figures.margin ?? 0), '40%')
  })

  test('the same figures give the same percentages whatever the currency', () => {
    const twoDecimals = fromCostAndPrice(60000, 100000, 2)
    const noDecimals = fromCostAndPrice(60000, 100000, 0)

    assert.equal(twoDecimals.margin, noDecimals.margin)
    assert.equal(twoDecimals.markup, noDecimals.markup)
  })
})

describe('checklist 9 — empty and invalid input', () => {
  test('an untouched form waits rather than warning', () => {
    const outcome = readMarginInputs(EMPTY_MARGIN_INPUTS, 'from-price')

    assert.ok(outcome.status === 'waiting')
    assert.deepEqual([...outcome.missing], ['cost', 'price'])
  })

  test('a half-typed field does not turn the panel red', () => {
    // "12." is a real keystroke state on the way to 12.5.
    const outcome = readMarginInputs({ ...EMPTY_MARGIN_INPUTS, cost: '12.' }, 'from-price')

    assert.ok(outcome.status === 'waiting')
  })

  test('a negative cost is refused in plain words', () => {
    const outcome = readMarginInputs(
      { ...EMPTY_MARGIN_INPUTS, cost: '-5', price: '10' },
      'from-price',
    )

    assert.ok(outcome.status === 'problem')
    assert.equal(outcome.problems[0]?.message, 'A cost cannot be a negative number.')
  })

  test('letters are refused with an example of what to type instead', () => {
    const outcome = readMarginInputs(
      { ...EMPTY_MARGIN_INPUTS, cost: 'abc', price: '10' },
      'from-price',
    )

    assert.ok(outcome.status === 'problem')
    assert.match(outcome.problems[0]?.message ?? '', /like 60000 or 60,000/)
  })

  test('a pasted grouped number is read as typed', () => {
    const outcome = readMarginInputs(
      { ...EMPTY_MARGIN_INPUTS, cost: '100,000', price: '150,000' },
      'from-price',
    )

    assert.ok(outcome.status === 'ready')
    assert.equal(outcome.figures.profit, 50000)
  })
})
