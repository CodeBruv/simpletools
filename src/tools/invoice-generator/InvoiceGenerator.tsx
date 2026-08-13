import { useMemo, useState } from 'react'
import { Printer } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import ToolShell, { type FaqItem } from '@/components/tools/ToolShell'
import { cn } from '@/lib/utils'
import type { ToolComponentProps } from '@/tools/registry'
import { calculateInvoice } from './calculateInvoice'
import { CURRENCIES, getCurrency } from './currencies'
import { createInvoice, createLineItem } from './invoiceDefaults'
import { inputClass, Label, StepSection, TextAreaField, TextField } from './InvoiceField'
import InvoiceItems from './InvoiceItems'
import InvoicePreview from './InvoicePreview'
import PartyFields from './PartyFields'
import { validateInvoice } from './validateInvoice'
import type { InvoiceData, LineItem, Party } from './types'

/**
 * Invoice Generator.
 *
 * The document updates as you type; there is no Generate step, because there is
 * nothing to wait for and nothing to submit. Everything — the arithmetic, the
 * formatting, the printing — happens in this tab. No invoice is uploaded, and
 * nothing is stored, so closing the tab is what deletes it.
 *
 * Export is the browser's own print dialogue, which every desktop and mobile
 * browser can save as a PDF. That is a deliberate choice over generating the PDF
 * in JavaScript: the fonts bundled with the PDF library in this project cannot
 * encode ₦, ₵, ₹ or Arabic script, so a naira invoice would either fail or lose
 * its currency symbol. The browser uses the system fonts and prints all of them.
 */

const HELP = (
  <>
    <p>
      Work down the form: your details, who you are billing, the invoice number and dates, then the
      items. The document on the right updates as you type, and what you see is what prints.
    </p>
    <p>
      When it looks right, use Print / Save as PDF and choose <em>Save as PDF</em> as the
      destination in the dialogue your browser opens. On a phone the same option appears under the
      share or print menu. Only the invoice prints, the form, the site navigation and everything
      else on this page are left out.
    </p>
  </>
)

const FAQ: readonly FaqItem[] = [
  {
    question: 'Where is my invoice saved?',
    answer:
      'Nowhere. It exists only in this tab while you work on it, and it is gone when you close or reload the page. Nothing is uploaded and nothing is kept, which also means there is no invoice history to come back to. Save the PDF somewhere you control.',
  },
  {
    question: 'How do I get a PDF?',
    answer:
      'Use Print / Save as PDF, then pick "Save as PDF" as the destination instead of a printer. Every current browser can do this, including on phones, and it produces a normal PDF you can email or file.',
  },
  {
    question: 'Does changing the currency convert the amounts?',
    answer:
      'No. It changes the symbol and the way numbers are written, and leaves your figures exactly as you typed them. There are no exchange rates here, converting would mean fetching a live rate, and this tool makes no network requests at all.',
  },
  {
    question: 'Can I put my logo on it?',
    answer:
      'Not yet. The invoice leads with your business name set in the document’s own typeface, which is enough to look professional. Image upload is the obvious next addition rather than something being withheld.',
  },
  {
    question: 'Is the tax calculation right for my country?',
    answer:
      'It applies one rate you choose to the amount after any discount, which is how a straightforward invoice works in most places. It is not a tax engine: it does not know your jurisdiction, thresholds, reverse charges or withholding rules. If your situation is more involved, check the figure with your accountant.',
  },
  {
    question: 'The invoice number always starts at INV-0001. Why?',
    answer:
      'Because nothing is remembered between visits, the tool cannot know what you sent last time, and inventing a higher number would imply a history it does not have. Type your own number over it, that field is yours.',
  },
]

export default function InvoiceGenerator({ tool }: ToolComponentProps) {
  const [invoice, setInvoice] = useState<InvoiceData>(() => createInvoice())

  const patch = (changes: Partial<InvoiceData>) =>
    setInvoice((current) => ({ ...current, ...changes }))

  const patchParty = (side: 'seller' | 'customer', changes: Partial<Party>) =>
    setInvoice((current) => ({ ...current, [side]: { ...current[side], ...changes } }))

  const patchItem = (id: string, changes: Partial<LineItem>) =>
    setInvoice((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    }))

  const addItem = () =>
    setInvoice((current) => ({ ...current, items: [...current.items, createLineItem()] }))

  /** The last row is never removed — an invoice with no rows has nothing to edit. */
  const removeItem = (id: string) =>
    setInvoice((current) =>
      current.items.length === 1
        ? current
        : { ...current, items: current.items.filter((item) => item.id !== id) },
    )

  const currency = useMemo(() => getCurrency(invoice.currencyCode), [invoice.currencyCode])
  const totals = useMemo(() => calculateInvoice(invoice), [invoice])
  const issues = useMemo(() => validateInvoice(invoice), [invoice])

  return (
    <ToolShell tool={tool} help={HELP} faq={FAQ}>
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start print:block">
        {/* The editor is application, not document, so it prints nothing. */}
        <div className="min-w-0 space-y-6" data-print="hide">
          <StepSection step={1} title="Your details" hint="Who the invoice is from.">
            <PartyFields
              idPrefix="seller"
              party={invoice.seller}
              onChange={(changes) => patchParty('seller', changes)}
              nameLabel="Business or your name"
              namePlaceholder="Code Bruv Technologies"
              includeWebsite
            />
          </StepSection>

          <StepSection step={2} title="Bill to" hint="Who is being charged.">
            <PartyFields
              idPrefix="customer"
              party={invoice.customer}
              onChange={(changes) => patchParty('customer', changes)}
              nameLabel="Customer name"
              namePlaceholder="John Doe"
            />
          </StepSection>

          <StepSection step={3} title="Invoice details">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="invoice-number"
                  label="Invoice number"
                  value={invoice.invoiceNumber}
                  onChange={(invoiceNumber) => patch({ invoiceNumber })}
                  placeholder="INV-0001"
                  className="font-mono"
                />

                <div className="min-w-0">
                  <Label htmlFor="invoice-currency">Currency</Label>
                  <select
                    id="invoice-currency"
                    value={invoice.currencyCode}
                    onChange={(event) => patch({ currencyCode: event.target.value })}
                    aria-describedby="invoice-currency-hint"
                    className={inputClass}
                  >
                    {CURRENCIES.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.code} — {option.name} ({option.symbol})
                      </option>
                    ))}
                  </select>
                  <p id="invoice-currency-hint" className="mt-1.5 text-[13px] leading-relaxed text-muted">
                    Changes how amounts are written. Your figures stay as typed.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="invoice-issued"
                  label="Issue date"
                  type="date"
                  value={invoice.issueDate}
                  onChange={(issueDate) => patch({ issueDate })}
                />
                <TextField
                  id="invoice-due"
                  label="Due date"
                  type="date"
                  value={invoice.dueDate}
                  onChange={(dueDate) => patch({ dueDate })}
                />
              </div>
            </div>
          </StepSection>

          <StepSection step={4} title="Items" hint="What you are charging for.">
            <InvoiceItems
              items={invoice.items}
              currency={currency}
              onChange={patchItem}
              onAdd={addItem}
              onRemove={removeItem}
            />
          </StepSection>

          <StepSection step={5} title="Discount and tax" hint="Leave blank if they do not apply.">
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                id="invoice-discount"
                label={`Discount (${currency.symbol})`}
                optional
                inputMode="decimal"
                value={invoice.discount}
                onChange={(discount) => patch({ discount })}
                placeholder="0.00"
                className="text-right font-mono tabular-nums"
              />
              <TextField
                id="invoice-tax-rate"
                label="Tax rate (%)"
                optional
                inputMode="decimal"
                value={invoice.taxRate}
                onChange={(taxRate) => patch({ taxRate })}
                placeholder="7.5"
                className="text-right font-mono tabular-nums"
              />
              <TextField
                id="invoice-tax-label"
                label="Tax name"
                optional
                value={invoice.taxLabel}
                onChange={(taxLabel) => patch({ taxLabel })}
                placeholder="VAT"
              />
            </div>
          </StepSection>

          <StepSection step={6} title="Notes and terms" hint="Optional, shown at the foot of the invoice.">
            <div className="space-y-4">
              <TextAreaField
                id="invoice-terms"
                label="Payment terms"
                optional
                value={invoice.terms}
                onChange={(terms) => patch({ terms })}
                placeholder={'Payment due within 14 days.\nBank: 0123456789, Example Bank.'}
                rows={2}
              />
              <TextAreaField
                id="invoice-notes"
                label="Notes"
                optional
                value={invoice.notes}
                onChange={(notes) => patch({ notes })}
                placeholder="Thanks for your business."
                rows={2}
              />
            </div>
          </StepSection>
        </div>

        {/*
          The document sits alongside the form on a wide screen and below it on a
          phone, which keeps the reading order the same as the task order. In
          print it stops being sticky and becomes the page.
        */}
        <aside className="min-w-0 lg:sticky lg:top-24 print:static">
          <div className="flex flex-wrap items-center justify-between gap-3" data-print="hide">
            <h2 className="eyebrow">Preview</h2>
            <Button type="button" size="lg" onClick={() => window.print()}>
              <Printer className="size-4" strokeWidth={2} aria-hidden="true" />
              Print / Save as PDF
            </Button>
          </div>

          {/*
            Advisory, never blocking: the preview renders from the first
            keystroke, because watching the document appear is what makes the
            form make sense. This just names what is still missing.
          */}
          {issues.length > 0 && (
            <div
              data-print="hide"
              className={cn('mt-3 rounded-lg border border-line bg-canvas p-3 text-[13px]')}
            >
              <p className="font-medium text-ink">Before you send this:</p>
              <ul className="mt-1.5 space-y-1 text-muted">
                {issues.map((issue) => (
                  <li key={issue.field}>{issue.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <InvoicePreview invoice={invoice} totals={totals} currency={currency} />
          </div>

          <p
            data-print="hide"
            className="mt-3 text-[13px] leading-relaxed text-muted"
            aria-live="polite"
          >
            {issues.length === 0
              ? 'Ready to print. Choose Save as PDF in the print dialogue to keep a copy.'
              : 'The invoice updates as you type.'}
          </p>
        </aside>
      </div>
    </ToolShell>
  )
}
