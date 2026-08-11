import type { MarginFigures } from './types'

/**
 * The profit arithmetic, kept away from React so a result can never depend on
 * render order, and so the numbers in the manual test checklist can be executed
 * rather than trusted.
 *
 * Nothing in this module touches the DOM, storage, or the network. It takes
 * numbers and returns numbers.
 *
 * The three quantities are easy to conflate and are not interchangeable:
 *
 *   profit = price - cost
 *   margin = profit / price * 100   (share of what the customer pays)
 *   markup = profit / cost  * 100   (how much was added to the cost)
 *
 * On a 60,000 cost sold at 100,000 the profit is 40,000, which is a 40% margin
 * and a 66.67% markup. Same trade, two different numbers.
 */

/** A margin of 100% would require a cost of zero, so it is the open upper bound. */
export const MAX_TARGET_MARGIN = 100

/**
 * Rounds to whole minor units — kobo, cents, or nothing at all for the yen.
 *
 * Money is the only thing rounded inside the engine, and it is rounded because
 * the values are about to be *displayed*: a price of 14.925372 does not exist,
 * so calculating a margin from it would describe a sale nobody can make. The
 * percentages are left exact and rounded only by `formatPercent`, at the edge.
 *
 * The epsilon nudge matches the invoice engine deliberately, so two money
 * calculations in the same product do not disagree by a kobo. It exists because
 * a value such as 1.005 is really 1.00499… in binary and would otherwise round
 * down, away from the decimal the user typed. It is a correction for that
 * representation gap only — it is far too small to move any value that is not
 * already sitting on the boundary.
 */
export function roundMoney(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/**
 * Profit as a percentage of the selling price.
 *
 * Null at a price of zero. That is not the same as 0%: giving something away
 * has no margin at all, because there is no revenue to take a share of.
 */
export function marginOf(profit: number, price: number): number | null {
  if (price === 0) return null
  return (profit / price) * 100
}

/**
 * Profit as a percentage of the cost.
 *
 * Null at a cost of zero, for the same reason — there is nothing to mark up.
 */
export function markupOf(profit: number, cost: number): number | null {
  if (cost === 0) return null
  return (profit / cost) * 100
}

/**
 * The main question: cost and selling price in, everything else out.
 *
 * A price below cost is a perfectly valid calculation — it is a loss, and the
 * profit, margin and markup all come out negative. Clamping any of them to zero
 * would hide exactly the situation someone opens a margin calculator to check.
 */
export function fromCostAndPrice(cost: number, price: number, decimals: number): MarginFigures {
  const safeCost = roundMoney(cost, decimals)
  const safePrice = roundMoney(price, decimals)
  const profit = roundMoney(safePrice - safeCost, decimals)

  return {
    cost: safeCost,
    price: safePrice,
    profit,
    margin: marginOf(profit, safePrice),
    markup: markupOf(profit, safeCost),
  }
}

/** Whether a required selling price exists for this margin. */
export function isAchievableMargin(marginPercent: number): boolean {
  return marginPercent >= 0 && marginPercent < MAX_TARGET_MARGIN
}

/**
 * "What should I charge to make this margin?"
 *
 *   price = cost / (1 - margin/100)
 *
 * written as `cost * 100 / (100 - margin)`, which is the same identity kept in
 * the scale the user typed. The textbook form builds the fraction first, and at
 * 40% that fraction is 0.6 — not representable in binary, so the division
 * inherits an error the multiplication form never introduces.
 *
 * The returned figures are derived from the *rounded* price, so the margin shown
 * is the margin of the price actually quoted. Asking for 33% on a cost of 10
 * gives a price of 14.93 and a margin of 33.02%, because 14.93 is the real
 * number being charged. Reporting the requested 33% against a price that does
 * not produce it would be the more comfortable lie.
 *
 * Callers validate the range first; the guard below only ensures that an
 * impossible request can never turn into a negative price.
 */
export function fromTargetMargin(
  cost: number,
  marginPercent: number,
  decimals: number,
): MarginFigures {
  const safeCost = roundMoney(cost, decimals)
  if (!isAchievableMargin(marginPercent)) return fromCostAndPrice(safeCost, 0, decimals)

  const price = (safeCost * 100) / (MAX_TARGET_MARGIN - marginPercent)
  return fromCostAndPrice(safeCost, price, decimals)
}

/**
 * "What should I charge to make this much profit?"
 *
 * Simply cost plus the profit. A negative target is allowed — someone may be
 * working out how much a planned discount costs them — and the resulting margin
 * and markup come out negative to match.
 */
export function fromTargetProfit(
  cost: number,
  desiredProfit: number,
  decimals: number,
): MarginFigures {
  const safeCost = roundMoney(cost, decimals)
  return fromCostAndPrice(safeCost, safeCost + desiredProfit, decimals)
}

/**
 * Formats a percentage for display: 40 → "40%", 66.666… → "66.67%", -25 → "-25%".
 *
 * Trailing zeros are dropped because "40.00%" reads like a measurement when it
 * is a plain answer, while 66.67% genuinely needs both places. The hyphen for
 * negatives matches how `formatMoney` writes a negative amount, so a loss looks
 * the same in both halves of the result panel.
 */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%'

  const rounded = roundMoney(value, 2)
  // Catches -0 as well, which would otherwise print as "-0%".
  if (rounded === 0) return '0%'

  const text = rounded.toFixed(2).replace(/\.?0+$/, '')
  return `${text}%`
}
