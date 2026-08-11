import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { lineTotal } from './calculateInvoice'
import { formatMoney, type Currency } from './currencies'
import { inputClass } from './InvoiceField'
import type { LineItem } from './types'

/**
 * The line-item editor.
 *
 * On a narrow screen each item becomes its own card with visible labels; from
 * `sm` up the labels collapse to screen-reader-only text and a single header row
 * carries the column names. That keeps one set of inputs — no separate mobile
 * implementation — and keeps every control genuinely labelled at both sizes.
 */

const numberClass = 'text-right font-mono tabular-nums'

/** Visible on mobile where there are no column headers; announced only above it. */
const rowLabelClass = 'text-[12px] font-medium text-muted sm:sr-only'

export default function InvoiceItems({
  items,
  currency,
  onChange,
  onAdd,
  onRemove,
}: {
  items: readonly LineItem[]
  currency: Currency
  onChange: (id: string, patch: Partial<LineItem>) => void
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="min-w-0">
      {/* Column headers, shown once, only where the row layout is horizontal. */}
      <div
        aria-hidden="true"
        className={cn(
          'hidden gap-3 border-b border-line pb-2 sm:grid',
          'sm:grid-cols-[minmax(0,1fr)_4.5rem_7rem_7rem_2.75rem]',
        )}
      >
        <span className="eyebrow">Description</span>
        <span className="eyebrow text-right">Qty</span>
        <span className="eyebrow text-right">Unit price</span>
        <span className="eyebrow text-right">Amount</span>
        <span className="sr-only">Remove</span>
      </div>

      <ul className="space-y-3 sm:space-y-0 sm:divide-y sm:divide-line">
        {items.map((item, index) => {
          const position = index + 1
          const amount = lineTotal(item)

          return (
            <li
              key={item.id}
              className={cn(
                'rounded-lg border border-line bg-canvas p-3',
                'sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-3',
              )}
            >
              <div
                className={cn(
                  'grid gap-3 sm:grid-cols-[minmax(0,1fr)_4.5rem_7rem_7rem_2.75rem] sm:items-center',
                )}
              >
                <div className="min-w-0">
                  <label htmlFor={`item-${item.id}-description`} className={rowLabelClass}>
                    Description of item {position}
                  </label>
                  <input
                    id={`item-${item.id}-description`}
                    type="text"
                    value={item.description}
                    onChange={(event) => onChange(item.id, { description: event.target.value })}
                    placeholder="Website Design"
                    className={cn(inputClass, 'mt-1 sm:mt-0')}
                  />
                </div>

                {/* Quantity and price share a row on mobile so neither is squeezed. */}
                <div className="grid grid-cols-2 gap-3 sm:contents">
                  <div className="min-w-0">
                    <label htmlFor={`item-${item.id}-quantity`} className={rowLabelClass}>
                      Quantity of item {position}
                    </label>
                    <input
                      id={`item-${item.id}-quantity`}
                      type="text"
                      inputMode="decimal"
                      value={item.quantity}
                      onChange={(event) => onChange(item.id, { quantity: event.target.value })}
                      placeholder="1"
                      className={cn(inputClass, numberClass, 'mt-1 sm:mt-0')}
                    />
                  </div>

                  <div className="min-w-0">
                    <label htmlFor={`item-${item.id}-price`} className={rowLabelClass}>
                      Unit price of item {position}
                    </label>
                    <input
                      id={`item-${item.id}-price`}
                      type="text"
                      inputMode="decimal"
                      value={item.unitPrice}
                      onChange={(event) => onChange(item.id, { unitPrice: event.target.value })}
                      placeholder="0.00"
                      className={cn(inputClass, numberClass, 'mt-1 sm:mt-0')}
                    />
                  </div>
                </div>

                {/*
                  The amount is computed, never typed — so it is text, not a
                  disabled input that invites a click.
                */}
                <div className="flex items-baseline justify-between gap-3 sm:block sm:text-right">
                  <span className={cn(rowLabelClass, 'sm:hidden')}>Amount</span>
                  <span className="font-mono text-[15px] tabular-nums text-ink">
                    {formatMoney(amount, currency)}
                  </span>
                </div>

                <div className="sm:flex sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    disabled={items.length === 1}
                    className={cn(
                      'flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border',
                      'border-line text-sm text-muted transition-colors sm:size-11 sm:w-11',
                      'hover:border-danger hover:text-danger',
                      'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line',
                      'disabled:hover:text-muted',
                    )}
                  >
                    <Trash2 className="size-4" strokeWidth={2} aria-hidden="true" />
                    <span className="sm:sr-only">
                      Remove{item.description.trim() ? ` ${item.description.trim()}` : ` item ${position}`}
                    </span>
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-4">
        <Button type="button" variant="secondary" onClick={onAdd}>
          <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
          Add item
        </Button>

        {items.length === 1 && (
          <p className="text-[13px] leading-relaxed text-muted">
            An invoice needs at least one item.
          </p>
        )}
      </div>
    </div>
  )
}
