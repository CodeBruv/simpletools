import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { getCurrency } from '@/tools/invoice-generator/currencies'
import {
  fromCostAndPrice,
  fromTargetMargin,
  fromTargetProfit,
} from '@/tools/profit-margin/calculateMargin'
import {
  MARGIN_VS_MARKUP,
  headlineFor,
  placeholderRows,
  plainSummary,
  profitLabel,
  rowsFor,
  spokenSummary,
  waitingMessage,
} from '@/tools/profit-margin/marginSummary'
import type { MarginMode } from '@/tools/profit-margin/types'

/**
 * The words the result panel says.
 *
 * The arithmetic is covered by calculateMargin.test.ts. What is checked here is
 * the copy: that a loss is called a loss, that an amount which does not exist is
 * explained rather than printed as zero, and that the line a screen reader hears
 * says the same thing as the panel on screen.
 */

const NGN = getCurrency('NGN')
const USD = getCurrency('USD')
const JPY = getCurrency('JPY')

const MODES: readonly MarginMode[] = ['from-price', 'target-margin', 'target-profit']

/** 60,000 sold at 100,000: 40,000 profit, 40% margin, 66.67% markup. */
const PROFITABLE = fromCostAndPrice(60000, 100000, 2)
const LOSING = fromCostAndPrice(100000, 80000, 2)
const BREAK_EVEN = fromCostAndPrice(100000, 100000, 2)

describe('naming the direction', () => {
  test('profit, loss and break-even are each named in words', () => {
    // The sign and the colour are not the only signal: someone reading quickly,
    // or not seeing colour at all, gets the direction from the label.
    assert.equal(profitLabel(40000), 'Profit')
    assert.equal(profitLabel(-20000), 'Loss')
    assert.equal(profitLabel(0), 'Break-even')
  })

  test('a negative zero is still break-even, not a loss', () => {
    // -0 arises from rounding a tiny shortfall and would otherwise be labelled a
    // loss of nothing.
    assert.equal(profitLabel(-0), 'Break-even')
  })
})

describe('what an unfinished form says', () => {
  test('it names the fields still needed, in the user’s words', () => {
    assert.equal(waitingMessage(['cost', 'price']), 'Enter the cost and selling price to see your numbers.')
    assert.equal(waitingMessage(['cost']), 'Enter the cost to see your numbers.')
    assert.equal(
      waitingMessage(['cost', 'targetMargin']),
      'Enter the cost and margin you want to see your numbers.',
    )
    assert.equal(
      waitingMessage(['cost', 'targetProfit']),
      'Enter the cost and profit you want to see your numbers.',
    )
  })

  test('three or more are listed with commas and a final "and"', () => {
    assert.equal(
      waitingMessage(['cost', 'price', 'targetMargin']),
      'Enter the cost, selling price and margin you want to see your numbers.',
    )
  })

  test('nothing missing says nothing at all', () => {
    // The panel renders this string directly, so an empty array must not produce
    // a dangling "Enter the  to see your numbers."
    assert.equal(waitingMessage([]), '')
  })

  test('it never leaks a field name from the code', () => {
    const everything = waitingMessage(['cost', 'price', 'targetMargin', 'targetProfit'])
    assert.doesNotMatch(everything, /targetMargin|targetProfit/)
    assert.match(everything, /\.$/)
  })
})

describe('the one-sentence answer', () => {
  test('a profit reads as money kept after covering the cost', () => {
    assert.equal(
      plainSummary(PROFITABLE, NGN),
      'You make ₦40,000.00 after covering the ₦60,000.00 cost on a ₦100,000.00 sale.',
    )
  })

  test('a loss states the shortfall unsigned, because "you lose -20,000" inverts it', () => {
    const sentence = plainSummary(LOSING, NGN)

    assert.equal(
      sentence,
      'You lose ₦20,000.00 — a ₦80,000.00 sale does not cover the ₦100,000.00 cost.',
    )
    assert.ok(!sentence.includes('-₦'), 'the sign belongs on the headline, not in the prose')
  })

  test('break-even is described as covering the cost exactly', () => {
    assert.equal(
      plainSummary(BREAK_EVEN, NGN),
      'You break even — a ₦100,000.00 sale exactly covers the ₦100,000.00 cost.',
    )
  })

  test('every direction names both the cost and the price', () => {
    // Without both figures the sentence cannot be checked against what was typed.
    for (const figures of [PROFITABLE, LOSING, BREAK_EVEN]) {
      const sentence = plainSummary(figures, USD)
      assert.ok(sentence.includes('$'), sentence)
      assert.match(sentence, /^You (make|lose|break even)/)
    }
  })
})

describe('the headline answers the question that was asked', () => {
  test('asked for profit, it leads with the profit', () => {
    assert.deepEqual(headlineFor('from-price', PROFITABLE, NGN), {
      label: 'Profit',
      value: '₦40,000.00',
    })
    assert.deepEqual(headlineFor('from-price', LOSING, NGN), {
      label: 'Loss',
      value: '-₦20,000.00',
    })
  })

  test('asked what to charge, it leads with the price in both target modes', () => {
    const byMargin = fromTargetMargin(60000, 40, 2)
    const byProfit = fromTargetProfit(60000, 40000, 2)

    assert.deepEqual(headlineFor('target-margin', byMargin, NGN), {
      label: 'Sell at',
      value: '₦100,000.00',
    })
    assert.deepEqual(headlineFor('target-profit', byProfit, NGN), {
      label: 'Sell at',
      value: '₦100,000.00',
    })
  })

  test('a target mode still leads with the price even when the answer is a loss', () => {
    // Planning a discount: the question was what to charge, so that stays first
    // and the loss moves into the rows below.
    const discounted = fromTargetProfit(60000, -20000, 2)

    assert.deepEqual(headlineFor('target-profit', discounted, NGN), {
      label: 'Sell at',
      value: '₦40,000.00',
    })
    assert.deepEqual(rowsFor('target-profit', discounted, NGN)[0], {
      label: 'Loss',
      value: '-₦20,000.00',
    })
  })
})

describe('the supporting rows', () => {
  test('the profit question shows margin then markup, and nothing else', () => {
    assert.deepEqual(rowsFor('from-price', PROFITABLE, NGN), [
      { label: 'Profit margin', value: '40%' },
      { label: 'Markup', value: '66.67%' },
    ])
  })

  test('a target question moves the profit into the rows', () => {
    assert.deepEqual(rowsFor('target-margin', fromTargetMargin(60000, 40, 2), NGN), [
      { label: 'Profit', value: '₦40,000.00' },
      { label: 'Profit margin', value: '40%' },
      { label: 'Markup', value: '66.67%' },
    ])
  })

  test('row labels are unique, because the panel keys its rows by label', () => {
    for (const mode of MODES) {
      const labels = rowsFor(mode, PROFITABLE, NGN).map((row) => row.label)
      assert.equal(new Set(labels).size, labels.length, `${mode} repeats a row label`)
    }
  })

  test('the percentage rows keep their order and wording across all three modes', () => {
    // The two percentages must not swap places when the mode changes, or a
    // number appears to move on its own while the user is reading it.
    for (const mode of MODES) {
      const labels = rowsFor(mode, PROFITABLE, NGN).map((row) => row.label)
      assert.deepEqual(labels.slice(-2), ['Profit margin', 'Markup'], mode)
    }
  })

  test('the margin shown is the margin of the price actually quoted', () => {
    // Asking for 33% on a cost of 10 gives 14.93, whose real margin is 33.02%.
    // Repeating the requested 33% against a price that does not produce it would
    // be the more comfortable answer and the wrong one.
    const rows = rowsFor('target-margin', fromTargetMargin(10, 33, 2), NGN)

    assert.deepEqual(rows, [
      { label: 'Profit', value: '₦4.93' },
      { label: 'Profit margin', value: '33.02%' },
      { label: 'Markup', value: '49.3%' },
    ])
  })
})

describe('amounts that do not exist are explained, not printed as zero', () => {
  test('a price of zero has no margin, and says why', () => {
    assert.deepEqual(rowsFor('from-price', fromCostAndPrice(50000, 0, 2), NGN), [
      { label: 'Profit margin', value: '—', note: 'Needs a selling price above zero.' },
      { label: 'Markup', value: '-100%' },
    ])
  })

  test('a cost of zero has no markup, and says why', () => {
    assert.deepEqual(rowsFor('from-price', fromCostAndPrice(0, 50000, 2), NGN), [
      { label: 'Profit margin', value: '100%' },
      { label: 'Markup', value: '—', note: 'Needs a cost above zero.' },
    ])
  })

  test('a free item priced for a margin explains both at once', () => {
    assert.deepEqual(rowsFor('target-margin', fromTargetMargin(0, 40, 2), NGN), [
      { label: 'Break-even', value: '₦0.00' },
      { label: 'Profit margin', value: '—', note: 'Needs a selling price above zero.' },
      { label: 'Markup', value: '—', note: 'Needs a cost above zero.' },
    ])
  })

  test('a note only ever accompanies an em dash, never a real number', () => {
    // A reason printed beside an actual figure would read as a warning about it.
    const cases = [
      fromCostAndPrice(0, 50000, 2),
      fromCostAndPrice(50000, 0, 2),
      fromCostAndPrice(0, 0, 2),
      PROFITABLE,
      LOSING,
    ]

    for (const mode of MODES) {
      for (const figures of cases) {
        for (const row of rowsFor(mode, figures, NGN)) {
          if (row.note) assert.equal(row.value, '—', `${row.label} has a note beside ${row.value}`)
        }
      }
    }
  })
})

describe('what a screen reader hears', () => {
  test('it is one line built from the rows on screen', () => {
    assert.equal(
      spokenSummary('from-price', PROFITABLE, NGN),
      'Profit ₦40,000.00. Profit margin 40%. Markup 66.67%.',
    )
    assert.equal(
      spokenSummary('target-margin', fromTargetMargin(60000, 40, 2), NGN),
      'Sell at ₦100,000.00. Profit ₦40,000.00. Profit margin 40%. Markup 66.67%.',
    )
  })

  test('every figure on screen is in the spoken line, in the same order', () => {
    for (const mode of MODES) {
      for (const figures of [PROFITABLE, LOSING, BREAK_EVEN]) {
        const spoken = spokenSummary(mode, figures, NGN)
        const onScreen = [headlineFor(mode, figures, NGN), ...rowsFor(mode, figures, NGN)]

        let cursor = 0
        for (const row of onScreen) {
          const at = spoken.indexOf(`${row.label} ${row.value}`, cursor)
          assert.ok(at >= cursor, `${mode}: "${row.label} ${row.value}" is missing or out of order`)
          cursor = at
        }
        assert.match(spoken, /\.$/)
      }
    }
  })
})

describe('the panel keeps its shape before the first answer', () => {
  test('the placeholder has one line for the headline and one per row', () => {
    // Otherwise the page shifts under the user's hands the moment a figure lands.
    for (const mode of MODES) {
      assert.equal(
        placeholderRows(mode).length,
        1 + rowsFor(mode, PROFITABLE, NGN).length,
        `${mode} changes height when the answer arrives`,
      )
    }
  })

  test('the placeholder labels match the labels that will replace them', () => {
    for (const mode of MODES) {
      assert.deepEqual(
        placeholderRows(mode).map((row) => row.label),
        [
          headlineFor(mode, PROFITABLE, NGN).label,
          ...rowsFor(mode, PROFITABLE, NGN).map((row) => row.label),
        ],
        mode,
      )
    }
  })

  test('every placeholder value is an em dash with no reason attached', () => {
    for (const mode of MODES) {
      for (const row of placeholderRows(mode)) {
        assert.equal(row.value, '—')
        assert.equal(row.note, undefined)
      }
    }
  })
})

describe('nothing machine-readable reaches the screen', () => {
  test('no output contains NaN, Infinity, null or undefined', () => {
    const figures = [
      PROFITABLE,
      LOSING,
      BREAK_EVEN,
      fromCostAndPrice(0, 0, 2),
      fromCostAndPrice(0, 50000, 2),
      fromCostAndPrice(50000, 0, 2),
      fromTargetMargin(0, 40, 2),
      fromTargetMargin(10, 99.99, 2),
      fromTargetProfit(60000, -60000, 2),
      fromCostAndPrice(0.001, 0.002, 2),
    ]

    for (const currency of [NGN, USD, JPY]) {
      for (const mode of MODES) {
        for (const set of figures) {
          const output = [
            plainSummary(set, currency),
            spokenSummary(mode, set, currency),
            headlineFor(mode, set, currency).value,
            ...rowsFor(mode, set, currency).map((row) => `${row.value} ${row.note ?? ''}`),
          ].join(' | ')

          assert.doesNotMatch(output, /NaN|Infinity|null|undefined/, `${mode} ${currency.code}: ${output}`)
        }
      }
    }
  })
})

describe('the margin-versus-markup explanation', () => {
  test('it defines both terms, and distinguishes them', () => {
    // Written once and shared by the panel and the FAQ, so the two cannot drift.
    assert.match(MARGIN_VS_MARKUP, /margin/i)
    assert.match(MARGIN_VS_MARKUP, /markup/i)
    assert.match(MARGIN_VS_MARKUP, /selling price/i)
    assert.match(MARGIN_VS_MARKUP, /cost/i)
  })
})
