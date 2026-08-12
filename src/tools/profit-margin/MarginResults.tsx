import type { Currency } from '@/tools/invoice-generator/currencies'

import {
  MARGIN_VS_MARKUP,
  type MarginRow,
  headlineFor,
  placeholderRows,
  plainSummary,
  rowsFor,
  spokenSummary,
  waitingMessage,
} from './marginSummary'
import type { MarginMode, MarginOutcome } from './types'

/**
 * The answer panel.
 *
 * It keeps the same shape in all three states — the rows are present with an em
 * dash before anything has been typed — so the page does not jump when the
 * first answer arrives, and so someone can see what they are about to get.
 *
 * Profit and loss are named in words as well as signed, because a red number is
 * not a signal for everyone reading it.
 */
export default function MarginResults({
  mode,
  outcome,
  currency,
}: {
  mode: MarginMode
  outcome: MarginOutcome
  currency: Currency
}) {
  const ready = outcome.status === 'ready'
  const figures = ready ? outcome.figures : null

  const headline: MarginRow | null = figures ? headlineFor(mode, figures, currency) : null
  const rows = figures ? rowsFor(mode, figures, currency) : placeholderRows(mode)

  const nothingYet =
    outcome.status === 'waiting'
      ? waitingMessage(outcome.missing)
      : outcome.status === 'problem'
        ? 'Check the notes on the form and your numbers will appear here.'
        : ''

  return (
    <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="eyebrow">Your numbers</h2>

        {headline && figures ? (
          <>
            <p className="mt-4 text-sm font-medium text-muted">{headline.label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-ink tabular-nums sm:text-4xl">
              {headline.value}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              {plainSummary(figures, currency)}
            </p>
          </>
        ) : (
          <p className="mt-4 text-[15px] leading-relaxed text-muted">{nothingYet}</p>
        )}

        <dl className="mt-6 divide-y divide-line border-t border-line">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-[15px] text-muted">{row.label}</dt>
              <dd className="min-w-0 text-right">
                <span className="text-[17px] font-semibold text-ink tabular-nums">{row.value}</span>
                {row.note && (
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                    {row.note}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 text-[13px] leading-relaxed text-muted">{MARGIN_VS_MARKUP}</p>
      </div>

      {/*
        Announced rather than shown: the figures above update on every keystroke,
        and a screen reader needs to hear the finished answer, not each digit.
      */}
      <p aria-live="polite" className="sr-only">
        {figures ? spokenSummary(mode, figures, currency) : nothingYet}
      </p>
    </aside>
  )
}
