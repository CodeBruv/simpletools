import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_MARGIN_CURRENCY,
  EMPTY_MARGIN_INPUTS,
  problemFor,
  readMarginInputs,
  readNumber,
} from '@/tools/profit-margin/marginInputs'
import type { MarginInputs, MarginMode, MarginOutcome } from '@/tools/profit-margin/types'

/**
 * The layer between a keyboard and the arithmetic. Two things matter here: a
 * field the user has not finished typing must never be treated as a mistake,
 * and a field that genuinely cannot be used must produce a sentence rather than
 * a number nobody can act on.
 */

function inputs(patch: Partial<MarginInputs> = {}): MarginInputs {
  return { ...EMPTY_MARGIN_INPUTS, ...patch }
}

function ready(patch: Partial<MarginInputs>, mode: MarginMode) {
  const outcome = readMarginInputs(inputs(patch), mode)
  assert.equal(outcome.status, 'ready', `expected figures, got ${describeOutcome(outcome)}`)
  assert.ok(outcome.status === 'ready')
  return outcome.figures
}

function describeOutcome(outcome: MarginOutcome): string {
  if (outcome.status === 'problem') return `problems: ${outcome.problems.map((p) => p.message).join(' / ')}`
  if (outcome.status === 'waiting') return `waiting on: ${outcome.missing.join(', ')}`
  return 'ready'
}

describe('readNumber', () => {
  test('reads the ways people actually type money', () => {
    assert.deepEqual(readNumber('100000'), { kind: 'value', value: 100000 })
    assert.deepEqual(readNumber('100,000'), { kind: 'value', value: 100000 })
    assert.deepEqual(readNumber('1,250,000.50'), { kind: 'value', value: 1250000.5 })
    assert.deepEqual(readNumber('  40  '), { kind: 'value', value: 40 })
    assert.deepEqual(readNumber('12.5'), { kind: 'value', value: 12.5 })
    assert.deepEqual(readNumber('.5'), { kind: 'value', value: 0.5 })
    assert.deepEqual(readNumber('-20000'), { kind: 'value', value: -20000 })
    assert.deepEqual(readNumber('0'), { kind: 'value', value: 0 })
  })

  test('a number pasted with non-breaking spaces still reads', () => {
    // Written as escapes on purpose: as literal characters these two lines
    // would look identical to the one above and to each other.
    assert.deepEqual(readNumber('100\u00a0000'), { kind: 'value', value: 100000 })
    assert.deepEqual(readNumber('100\u202f000'), { kind: 'value', value: 100000 })
  })

  test('states a field passes through while being typed are blank, not wrong', () => {
    assert.deepEqual(readNumber(''), { kind: 'blank' })
    assert.deepEqual(readNumber('   '), { kind: 'blank' })
    assert.deepEqual(readNumber('-'), { kind: 'blank' })
    assert.deepEqual(readNumber('+'), { kind: 'blank' })
    assert.deepEqual(readNumber('.'), { kind: 'blank' })
    // "12." is a real 12 on the way to 12.5.
    assert.deepEqual(readNumber('12.'), { kind: 'value', value: 12 })
  })

  test('junk is refused', () => {
    assert.deepEqual(readNumber('abc'), { kind: 'invalid' })
    assert.deepEqual(readNumber('60,000 naira'), { kind: 'invalid' })
    assert.deepEqual(readNumber('12.5.6'), { kind: 'invalid' })
    assert.deepEqual(readNumber('--5'), { kind: 'invalid' })
    assert.deepEqual(readNumber('₦60000'), { kind: 'invalid' })
  })

  test('nothing that could become Infinity gets through', () => {
    assert.deepEqual(readNumber('Infinity'), { kind: 'invalid' })
    assert.deepEqual(readNumber('-Infinity'), { kind: 'invalid' })
    assert.deepEqual(readNumber('NaN'), { kind: 'invalid' })
    // Exponents are rejected outright, which is what stops 1e400.
    assert.deepEqual(readNumber('1e5'), { kind: 'invalid' })
    assert.deepEqual(readNumber('1e400'), { kind: 'invalid' })
    // 400 digits parses to Infinity, so the finite check catches it.
    assert.deepEqual(readNumber('9'.repeat(400)), { kind: 'invalid' })
  })
})

describe('waiting for input', () => {
  test('an untouched calculator asks for nothing and complains about nothing', () => {
    const outcome = readMarginInputs(inputs(), 'from-price')

    assert.equal(outcome.status, 'waiting')
    assert.ok(outcome.status === 'waiting')
    assert.deepEqual(outcome.missing, ['cost', 'price'])
  })

  test('a half-filled form waits on the rest instead of erroring', () => {
    const outcome = readMarginInputs(inputs({ cost: '60000' }), 'from-price')

    assert.equal(outcome.status, 'waiting')
    assert.ok(outcome.status === 'waiting')
    assert.deepEqual(outcome.missing, ['price'])
  })

  test('each question waits only on the fields it needs', () => {
    const filled = inputs({ cost: '60000' })

    for (const [mode, expected] of [
      ['target-margin', ['targetMargin']],
      ['target-profit', ['targetProfit']],
    ] as const) {
      const outcome = readMarginInputs(filled, mode)
      assert.ok(outcome.status === 'waiting', `${mode} should be waiting`)
      assert.deepEqual(outcome.missing, expected)
    }
  })

  test('a field left mid-keystroke does not trigger a warning', () => {
    const outcome = readMarginInputs(inputs({ cost: '60000', targetProfit: '-' }), 'target-profit')

    assert.equal(outcome.status, 'waiting')
  })
})

describe('problems', () => {
  test('unreadable text is named and explained per field', () => {
    const outcome = readMarginInputs(inputs({ cost: 'abc', price: '100000' }), 'from-price')

    assert.ok(outcome.status === 'problem')
    assert.equal(outcome.problems.length, 1)
    assert.equal(outcome.problems[0]?.field, 'cost')
    assert.match(outcome.problems[0]?.message ?? '', /number/i)
  })

  test('a negative cost or price is refused', () => {
    const cost = readMarginInputs(inputs({ cost: '-60000', price: '100000' }), 'from-price')
    assert.ok(cost.status === 'problem')
    assert.equal(problemFor(cost, 'cost'), 'A cost cannot be a negative number.')

    const price = readMarginInputs(inputs({ cost: '60000', price: '-100' }), 'from-price')
    assert.ok(price.status === 'problem')
    assert.match(problemFor(price, 'price') ?? '', /negative/i)
  })

  test('a 100% target margin is explained instead of dividing by zero', () => {
    const outcome = readMarginInputs(inputs({ cost: '60000', targetMargin: '100' }), 'target-margin')

    assert.ok(outcome.status === 'problem')
    const message = problemFor(outcome, 'targetMargin') ?? ''
    assert.match(message, /below 100%/)
    // The point of the message is the reason, not just the refusal.
    assert.match(message, /cost would have to be zero/)
    assert.doesNotMatch(message, /Infinity|NaN/)
  })

  test('a margin above 100% gets the same explanation', () => {
    for (const value of ['100.01', '150', '1000']) {
      const outcome = readMarginInputs(inputs({ cost: '60000', targetMargin: value }), 'target-margin')
      assert.ok(outcome.status === 'problem', `${value}% should be refused`)
    }
  })

  test('a negative target margin points at the other question', () => {
    const outcome = readMarginInputs(inputs({ cost: '60000', targetMargin: '-10' }), 'target-margin')

    assert.ok(outcome.status === 'problem')
    assert.match(problemFor(outcome, 'targetMargin') ?? '', /negative/i)
  })

  test('a loss deeper than the cost would need a price below zero', () => {
    const outcome = readMarginInputs(
      inputs({ cost: '60000', targetProfit: '-80000' }),
      'target-profit',
    )

    assert.ok(outcome.status === 'problem')
    assert.match(problemFor(outcome, 'targetProfit') ?? '', /below zero/)
  })

  test('a real problem is shown ahead of a field that is merely empty', () => {
    const outcome = readMarginInputs(inputs({ cost: 'abc' }), 'from-price')

    assert.equal(outcome.status, 'problem')
  })

  test('problemFor returns nothing when there is nothing wrong', () => {
    const outcome = readMarginInputs(inputs({ cost: '60000', price: '100000' }), 'from-price')

    assert.equal(problemFor(outcome, 'cost'), null)
    assert.equal(problemFor(outcome, 'price'), null)
  })
})

describe('answers', () => {
  test('zero is a legitimate entry, not a missing one', () => {
    const figures = ready({ cost: '0', price: '0' }, 'from-price')

    assert.equal(figures.profit, 0)
    assert.equal(figures.margin, null)
    assert.equal(figures.markup, null)
  })

  test('a loss comes through unclamped', () => {
    const figures = ready({ cost: '100,000', price: '80,000' }, 'from-price')

    assert.equal(figures.profit, -20000)
    assert.equal(figures.margin, -25)
    assert.equal(figures.markup, -20)
  })

  test('a loss the size of the cost is allowed, giving a price of zero', () => {
    const figures = ready({ cost: '60000', targetProfit: '-60000' }, 'target-profit')

    assert.equal(figures.price, 0)
    assert.equal(figures.profit, -60000)
    assert.equal(figures.margin, null)
    assert.equal(figures.markup, -100)
  })

  test('the chosen currency decides the precision', () => {
    const naira = ready({ cost: '10', price: '19.99', currencyCode: 'NGN' }, 'from-price')
    assert.equal(naira.profit, 9.99)

    // The yen has no minor unit, so a fractional price is not a price.
    const yen = ready({ cost: '10', price: '19.99', currencyCode: 'JPY' }, 'from-price')
    assert.equal(yen.price, 20)
    assert.equal(yen.profit, 10)

    const yenTarget = ready({ cost: '100', targetMargin: '33', currencyCode: 'JPY' }, 'target-margin')
    assert.equal(yenTarget.price, 149)
    assert.equal(yenTarget.profit, 49)
  })

  test('an unknown currency code falls back rather than blanking the answer', () => {
    const figures = ready({ cost: '60000', price: '100000', currencyCode: 'ZZZ' }, 'from-price')

    assert.equal(figures.profit, 40000)
  })
})

describe('defaults', () => {
  test('US dollars lead, and every field starts empty', () => {
    assert.equal(DEFAULT_MARGIN_CURRENCY, 'USD')
    assert.equal(EMPTY_MARGIN_INPUTS.currencyCode, 'USD')
    assert.equal(EMPTY_MARGIN_INPUTS.cost, '')
    assert.equal(EMPTY_MARGIN_INPUTS.price, '')
    assert.equal(EMPTY_MARGIN_INPUTS.targetMargin, '')
    assert.equal(EMPTY_MARGIN_INPUTS.targetProfit, '')
  })

  test('switching question keeps what was already typed', () => {
    // One shared field object is what makes this true; it is the reason the
    // cost survives a change of question.
    const typed = inputs({ cost: '60000', price: '100000', targetMargin: '40' })

    assert.equal(ready(typed, 'from-price').price, 100000)
    assert.equal(ready(typed, 'target-margin').cost, 60000)
  })
})
