import { itemQuantity, itemUnitPrice, lineTotal } from './calculateInvoice'
import { formatMoney, type Currency } from './currencies'
import { formatInvoiceDate } from './invoiceDefaults'
import type { InvoiceData, InvoiceTotals, Party } from './types'

/**
 * The invoice document.
 *
 * This is the only part of the page that reaches paper, so it is built out of
 * the `doc-*` tokens rather than the theme tokens: white paper and dark ink in
 * every theme. Someone working at night still sends a document that looks like
 * an invoice rather than a screenshot of a dark application.
 *
 * Every optional field is conditional. A missing phone number leaves no gap and
 * no orphaned label — the block above it simply ends.
 */

const CELL = 'py-2.5 align-top text-[13px] leading-snug'
const HEAD = 'py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-doc-muted'

/** Address lines, phone, email — each rendered only if it exists. */
function PartyLines({ party }: { party: Party }) {
  const lines = [party.address, party.email, party.phone, party.website].filter(
    (value): value is string => typeof value === 'string' && value.trim() !== '',
  )

  if (lines.length === 0) return null

  return (
    <div className="mt-1.5 space-y-0.5 text-[13px] leading-relaxed text-doc-muted">
      {lines.map((line) => (
        <p key={line} className="whitespace-pre-line break-words">
          {line}
        </p>
      ))}
    </div>
  )
}

function TotalRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={
        strong
          ? 'flex items-baseline justify-between gap-4 border-t-2 border-doc-line-strong pt-2.5'
          : 'flex items-baseline justify-between gap-4'
      }
    >
      <span
        className={
          strong
            ? 'text-[13px] font-semibold uppercase tracking-wide text-doc-ink'
            : 'text-[13px] text-doc-muted'
        }
      >
        {label}
      </span>
      <span
        className={
          strong
            ? 'font-mono text-[17px] font-semibold tabular-nums text-doc-ink'
            : 'font-mono text-[13px] tabular-nums text-doc-ink'
        }
      >
        {value}
      </span>
    </div>
  )
}

export default function InvoicePreview({
  invoice,
  totals,
  currency,
}: {
  invoice: InvoiceData
  totals: InvoiceTotals
  currency: Currency
}) {
  const money = (value: number) => formatMoney(value, currency)

  // A blank row is a row the user has not filled in yet; it belongs in the
  // editor, not on the document.
  const rows = invoice.items.filter(
    (item) => item.description.trim() !== '' || lineTotal(item) > 0,
  )

  const showDiscount = totals.discountAmount > 0
  const showTax = totals.taxAmount > 0
  const taxLabel = invoice.taxLabel.trim() === '' ? 'Tax' : invoice.taxLabel.trim()

  return (
    <article
      className="print-document rounded-lg border border-doc-line bg-doc p-5 text-doc-ink sm:p-8"
      aria-label="Invoice preview"
    >
      {/*
        The letterhead: who is billing, and the three facts that identify the
        document. It is a real `header` element because that is what it is — see
        the print block in globals.css, which must never hide it by tag name.

        The `print:` variants restate the wide layout rather than leaning on
        `sm:`. A print viewport is the page box, and at A4 with the margins in
        globals.css that lands just above the `sm` breakpoint — close enough
        that a smaller sheet, a wider margin or a scaled-down print would flip
        the letterhead into its phone layout. The table columns below already
        take the same precaution.
      */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between print:flex-row print:items-start print:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight break-words text-doc-ink">
            {invoice.seller.name.trim() === '' ? 'Your business name' : invoice.seller.name}
          </h2>
          <PartyLines party={invoice.seller} />
        </div>

        <div className="shrink-0 sm:text-right print:text-right">
          <p className="text-2xl font-semibold uppercase tracking-[0.15em] text-doc-accent">
            Invoice
          </p>
          <dl className="mt-2 space-y-0.5 text-[13px] leading-relaxed">
            {invoice.invoiceNumber.trim() !== '' && (
              <div className="flex gap-2 sm:justify-end print:justify-end">
                <dt className="text-doc-muted">Number</dt>
                <dd className="font-mono text-doc-ink">{invoice.invoiceNumber}</dd>
              </div>
            )}
            {invoice.issueDate.trim() !== '' && (
              <div className="flex gap-2 sm:justify-end print:justify-end">
                <dt className="text-doc-muted">Issued</dt>
                <dd className="text-doc-ink">{formatInvoiceDate(invoice.issueDate)}</dd>
              </div>
            )}
            {invoice.dueDate.trim() !== '' && (
              <div className="flex gap-2 sm:justify-end print:justify-end">
                <dt className="text-doc-muted">Due</dt>
                <dd className="text-doc-ink">{formatInvoiceDate(invoice.dueDate)}</dd>
              </div>
            )}
          </dl>
        </div>
      </header>

      <section className="mt-7 border-t border-doc-line pt-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-doc-faint">
          Bill to
        </h3>
        <p className="mt-1.5 text-[15px] font-medium break-words text-doc-ink">
          {invoice.customer.name.trim() === '' ? 'Customer name' : invoice.customer.name}
        </p>
        <PartyLines party={invoice.customer} />
      </section>

      <table className="mt-7 w-full table-auto border-collapse text-left">
        <thead>
          <tr className="border-b border-doc-line-strong">
            <th scope="col" className={`${HEAD} pr-3`}>
              Description
            </th>
            <th scope="col" className={`${HEAD} hidden px-3 text-right sm:table-cell print:table-cell`}>
              Qty
            </th>
            <th scope="col" className={`${HEAD} hidden px-3 text-right sm:table-cell print:table-cell`}>
              Unit price
            </th>
            <th scope="col" className={`${HEAD} pl-3 text-right`}>
              Amount
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-doc-line">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className={`${CELL} text-doc-faint`}>
                Your items will appear here.
              </td>
            </tr>
          ) : (
            rows.map((item) => (
              <tr key={item.id}>
                <td className={`${CELL} pr-3 break-words text-doc-ink`}>
                  {item.description.trim() === '' ? 'Item' : item.description}

                  {/*
                    On a phone there is no room for four columns, so quantity and
                    unit price ride under the description instead. Printing is
                    always wide enough for the real columns.
                  */}
                  <span className="mt-0.5 block font-mono text-[11px] text-doc-muted sm:hidden print:hidden">
                    {itemQuantity(item)} × {money(itemUnitPrice(item))}
                  </span>
                </td>
                <td
                  className={`${CELL} hidden px-3 text-right font-mono tabular-nums text-doc-muted sm:table-cell print:table-cell`}
                >
                  {itemQuantity(item)}
                </td>
                <td
                  className={`${CELL} hidden px-3 text-right font-mono tabular-nums text-doc-muted sm:table-cell print:table-cell`}
                >
                  {money(itemUnitPrice(item))}
                </td>
                <td className={`${CELL} pl-3 text-right font-mono tabular-nums text-doc-ink`}>
                  {money(lineTotal(item))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="print-keep-together w-full max-w-[16rem] space-y-2">
          <TotalRow label="Subtotal" value={money(totals.subtotal)} />
          {showDiscount && (
            <TotalRow label="Discount" value={`−${money(totals.discountAmount)}`} />
          )}
          {showTax && (
            <TotalRow
              label={`${taxLabel} (${invoice.taxRate.trim()}%)`}
              value={money(totals.taxAmount)}
            />
          )}
          <TotalRow label={`Total ${currency.code}`} value={money(totals.total)} strong />
        </div>
      </div>

      {/*
        The other half of the document that is a landmark element: payment terms
        and notes are the invoice's footer, not the site's. Also load-bearing for
        print — see the header above.
      */}
      {(invoice.terms.trim() !== '' || invoice.notes.trim() !== '') && (
        <footer className="mt-8 space-y-4 border-t border-doc-line pt-5">
          {invoice.terms.trim() !== '' && (
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-doc-faint">
                Payment terms
              </h3>
              <p className="mt-1 whitespace-pre-line break-words text-[13px] leading-relaxed text-doc-muted">
                {invoice.terms}
              </p>
            </div>
          )}

          {invoice.notes.trim() !== '' && (
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-doc-faint">
                Notes
              </h3>
              <p className="mt-1 whitespace-pre-line break-words text-[13px] leading-relaxed text-doc-muted">
                {invoice.notes}
              </p>
            </div>
          )}
        </footer>
      )}
    </article>
  )
}
