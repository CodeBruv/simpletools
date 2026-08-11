/**
 * Types for the Profit Margin Calculator.
 *
 * Three questions, one set of fields. Cost appears in all three modes, so the
 * fields live in a single object and switching mode keeps whatever has already
 * been typed — the alternative is a form that empties itself when the user
 * looks at the same numbers a different way.
 */

/** Which question the calculator is answering. */
export type MarginMode = 'from-price' | 'target-margin' | 'target-profit'

/** Every field the user can type into, across all three modes. */
export type MarginField = 'cost' | 'price' | 'targetMargin' | 'targetProfit'

/**
 * The raw text of each field.
 *
 * Strings rather than numbers on purpose: "12." and "" are states a number
 * cannot represent, and rewriting the user's half-typed input into a number and
 * back is what makes a field fight the person filling it in.
 */
export interface MarginInputs {
  cost: string
  price: string
  targetMargin: string
  targetProfit: string
  /** ISO 4217 code from the shared catalogue. Formatting only — never converted. */
  currencyCode: string
}

/**
 * The answer, once every field the current mode needs has a usable number.
 *
 * `margin` and `markup` are nullable because they are genuinely undefined at
 * zero, not zero: markup divides by cost, margin divides by price. Returning 0
 * for those would be a lie the UI would then repeat.
 */
export interface MarginFigures {
  cost: number
  price: number
  /** Selling price minus cost. Negative on a loss, never clamped. */
  profit: number
  /** Profit as a percentage of the selling price. Null when the price is zero. */
  margin: number | null
  /** Profit as a percentage of the cost. Null when the cost is zero. */
  markup: number | null
}

/** A field the user has filled in with something that cannot be used. */
export interface MarginProblem {
  field: MarginField
  message: string
}

/**
 * What the result panel should show.
 *
 * `waiting` exists so that an empty field is not an error. A calculator that
 * shows a red warning before the first number is typed is one the user has to
 * apologise to, and the spec is explicit that a temporarily empty input must
 * not block the interface.
 */
export type MarginOutcome =
  | { status: 'waiting'; missing: readonly MarginField[] }
  | { status: 'problem'; problems: readonly MarginProblem[] }
  | { status: 'ready'; figures: MarginFigures }
