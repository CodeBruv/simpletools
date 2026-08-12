import { useMemo, useState } from 'react'

import PrivacyNote from '@/components/tools/PrivacyNote'
import ToolShell, { type FaqItem } from '@/components/tools/ToolShell'
import { cn } from '@/lib/utils'
import type { ToolComponentProps } from '@/tools/registry'
import { CURRENCIES, getCurrency } from '@/tools/invoice-generator/currencies'
import MarginField from '@/tools/profit-margin/MarginField'
import MarginResults from '@/tools/profit-margin/MarginResults'
import {
  EMPTY_MARGIN_INPUTS,
  problemFor,
  readMarginInputs,
} from '@/tools/profit-margin/marginInputs'
import { MARGIN_VS_MARKUP } from '@/tools/profit-margin/marginSummary'
import type { MarginInputs, MarginMode } from '@/tools/profit-margin/types'

/**
 * Profit Margin Calculator.
 *
 * Answers three questions from the same two or three numbers: what a sale makes,
 * what to charge for a margin, and what to charge for a profit. The figures
 * update as you type — arithmetic this small has nothing to wait for, so a
 * Generate button would only add a step.
 *
 * The fields are shared across the three questions, so changing the question
 * keeps the cost you already typed.
 *
 * All of it is arithmetic in this tab. Nothing is uploaded, nothing is stored,
 * and no rate is ever looked up: choosing a currency changes how amounts are
 * written, never what they are worth.
 */

const MODES: readonly { value: MarginMode; label: string; hint: string }[] = [
  { value: 'from-price', label: 'My profit', hint: 'From a cost and a selling price' },
  { value: 'target-margin', label: 'Price for a margin', hint: 'To reach a margin you choose' },
  { value: 'target-profit', label: 'Price for a profit', hint: 'To reach a profit you choose' },
]

const HELP = (
  <>
    <p>
      Enter what something cost you and what you sell it for, and the profit, margin and markup
      appear as you type. The other two questions work backwards from where you want to end up: give
      a cost and the margin you need, or a cost and the profit you need, and you get the price to
      charge.
    </p>
    <p>
      {MARGIN_VS_MARKUP} They describe the same money from two angles, which is why one sale can be
      called 40% by an accountant and 66.67% by a supplier. Margin divides the profit by the price,
      so it can get close to 100% but never reach it. Markup divides it by the cost, so it can go
      far beyond 100%.
    </p>
    <p>
      Selling below cost is a real answer, not an error. Put the numbers in as they are and the
      profit, margin and markup all come back negative, so you can see the size of the loss instead
      of guessing at it.
    </p>
  </>
)

const FAQ: readonly FaqItem[] = [
  {
    question: 'What is the difference between margin and markup?',
    answer:
      'Both measure the same profit against a different base. On a 60,000 cost sold for 100,000 the profit is 40,000: that is 40% of the selling price, so a 40% margin, and 66.67% of the cost, so a 66.67% markup. Confusing the two is how a business thinks it is making more than it is.',
  },
  {
    question: 'Why can a margin never be 100%?',
    answer:
      'Margin is the share of the selling price left over as profit. Reaching 100% would mean the whole price is profit and the item cost you nothing, and asking for a price that leaves 100% margin has no answer at all. Markup has no such ceiling: doubling your money is a 100% markup and a 50% margin.',
  },
  {
    question: 'Which number should I use when I set prices?',
    answer:
      'Margin, usually. It tells you what share of each sale you keep, which is the figure that has to cover rent, wages and everything else. Markup is more useful when you are working up from a supplier price, and many trades quote it that way, so it helps to know both for the same item.',
  },
  {
    question: 'Does changing the currency convert my numbers?',
    answer:
      'No. It only changes how the amounts are written, including currencies that have no minor unit, such as the yen. Your figures stay exactly as you typed them. There is no exchange rate here and no request to any service that could supply one.',
  },
  {
    question: 'Do my figures leave my device?',
    answer:
      'No. The calculation happens in your browser, nothing is sent anywhere, and nothing is saved once you close the tab. Cost and price are commercially sensitive, so the tool is built so that there is nowhere for them to go.',
  },
]

export default function ProfitMargin({ tool }: ToolComponentProps) {
  const [mode, setMode] = useState<MarginMode>('from-price')
  const [inputs, setInputs] = useState<MarginInputs>(EMPTY_MARGIN_INPUTS)

  const patch = (changes: Partial<MarginInputs>) =>
    setInputs((current) => ({ ...current, ...changes }))

  const currency = useMemo(() => getCurrency(inputs.currencyCode), [inputs.currencyCode])
  const outcome = useMemo(() => readMarginInputs(inputs, mode), [inputs, mode])

  const money = `in ${currency.name}`

  return (
    <ToolShell tool={tool} help={HELP} faq={FAQ}>
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 space-y-6">
          <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
            <fieldset className="min-w-0">
              <legend className="eyebrow">What do you want to work out?</legend>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {MODES.map((option) => {
                  const active = mode === option.value

                  return (
                    <label
                      key={option.value}
                      className={cn(
                        'flex min-h-11 cursor-pointer flex-col justify-center rounded-lg border px-3 py-2',
                        'transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2',
                        'has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                        active
                          ? 'border-accent bg-accent-soft'
                          : 'border-line bg-canvas hover:border-line-strong',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="margin-mode"
                          value={option.value}
                          checked={active}
                          onChange={() => setMode(option.value)}
                          className="size-4 shrink-0 accent-accent"
                        />
                        <span className="text-sm font-medium text-ink">{option.label}</span>
                      </span>
                      <span className="mt-0.5 pl-6 text-[13px] leading-snug text-muted">
                        {option.hint}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <MarginField
                id="margin-cost"
                label="Cost"
                unitLabel={money}
                prefix={currency.symbol}
                value={inputs.cost}
                onChange={(cost) => patch({ cost })}
                error={problemFor(outcome, 'cost')}
                hint="What it costs you."
                placeholder="60000"
              />

              {mode === 'from-price' && (
                <MarginField
                  id="margin-price"
                  label="Selling price"
                  unitLabel={money}
                  prefix={currency.symbol}
                  value={inputs.price}
                  onChange={(price) => patch({ price })}
                  error={problemFor(outcome, 'price')}
                  hint="What the customer pays."
                  placeholder="100000"
                />
              )}

              {mode === 'target-margin' && (
                <MarginField
                  id="margin-target"
                  label="Margin you want"
                  unitLabel="as a percentage"
                  suffix="%"
                  value={inputs.targetMargin}
                  onChange={(targetMargin) => patch({ targetMargin })}
                  error={problemFor(outcome, 'targetMargin')}
                  hint="From 0 up to just under 100."
                  placeholder="40"
                />
              )}

              {mode === 'target-profit' && (
                <MarginField
                  id="margin-target-profit"
                  label="Profit you want"
                  unitLabel={money}
                  prefix={currency.symbol}
                  value={inputs.targetProfit}
                  onChange={(targetProfit) => patch({ targetProfit })}
                  error={problemFor(outcome, 'targetProfit')}
                  hint="What you want left after the cost."
                  placeholder="40000"
                />
              )}

              <div className="min-w-0">
                <label htmlFor="margin-currency" className="text-sm font-medium text-ink">
                  Currency
                </label>
                <select
                  id="margin-currency"
                  value={inputs.currencyCode}
                  onChange={(event) => patch({ currencyCode: event.target.value })}
                  aria-describedby="margin-currency-hint"
                  className={cn(
                    'mt-1.5 h-11 w-full min-w-0 rounded-lg border border-line bg-canvas px-3',
                    'text-[15px] text-ink focus-visible:outline focus-visible:outline-2',
                    'focus-visible:outline-offset-2 focus-visible:outline-accent',
                  )}
                >
                  {CURRENCIES.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.code} — {option.name} ({option.symbol})
                    </option>
                  ))}
                </select>
                <p
                  id="margin-currency-hint"
                  className="mt-1.5 text-[13px] leading-relaxed text-muted"
                >
                  Changes how amounts are written. Your figures stay as typed.
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <PrivacyNote>
                Your figures stay on your device. Everything is worked out in your browser, and
                nothing is saved when you close the tab.
              </PrivacyNote>
            </div>
          </section>
        </div>

        <MarginResults mode={mode} outcome={outcome} currency={currency} />
      </div>
    </ToolShell>
  )
}
