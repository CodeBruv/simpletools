import { AlertTriangle, Check, Info } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatBytes, formatPercent } from '@/lib/file'
import { MEANINGFUL_REDUCTION_PERCENT } from '@/tools/pdf-compressor/compressPdf'
import type { PdfCompressionResult } from '@/tools/pdf-compressor/types'

/**
 * The result readout, deliberately built so the honest outcomes are as loud as
 * the good one. Two bars drawn to scale, then whichever of three verdicts
 * applies: a real saving, a saving too small to be worth calling one, or a file
 * that grew.
 */
export default function PdfResultLedger({
  result,
  filename,
  busy,
}: {
  result: PdfCompressionResult
  filename: string
  busy: boolean
}) {
  const { originalBytes, compressedBytes, didHelp, reductionPercent } = result

  // Clamped so a result that grew still renders a sane bar.
  const ratio = originalBytes > 0 ? Math.min(compressedBytes / originalBytes, 1) : 0
  const negligible = didHelp && reductionPercent < MEANINGFUL_REDUCTION_PERCENT

  return (
    <div className={cn('transition-opacity duration-150', busy && 'opacity-60')}>
      <p className="truncate font-mono text-[13px] text-muted" title={filename}>
        {filename}
      </p>

      <div className="mt-5 space-y-4">
        <Bar label="Original" value={formatBytes(originalBytes)} widthPercent={100} tone="neutral" />
        <Bar
          label="Compressed"
          value={formatBytes(compressedBytes)}
          widthPercent={Math.max(ratio * 100, 1.5)}
          tone={didHelp && !negligible ? 'accent' : 'danger'}
        />
      </div>

      <div className="mt-6 border-t border-line pt-5">
        {!didHelp ? (
          <p className="flex items-start gap-2 text-[15px] leading-relaxed text-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span>
              {compressedBytes === originalBytes
                ? 'This came out exactly the same size.'
                : `This came out ${formatBytes(compressedBytes - originalBytes)} larger.`}{' '}
              Keep the file you already have.
              {result.mode === 'lossless' && ' Stronger compression would make a real difference.'}
            </span>
          </p>
        ) : negligible ? (
          <p className="flex items-start gap-2 text-[15px] leading-relaxed text-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2} aria-hidden="true" />
            <span>
              Only {formatPercent(reductionPercent)} smaller. This PDF was already well built, so
              there was almost no structural waste to remove.
            </span>
          </p>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="flex items-center gap-2 text-accent">
              <Check className="size-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
                {formatPercent(reductionPercent)}
              </span>
            </span>
            <span className="text-[15px] text-muted">smaller than the original</span>
          </div>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] sm:grid-cols-3">
        <Stat label="Pages" value={result.pageCount > 0 ? String(result.pageCount) : '—'} />
        <Stat label="Text" value={result.textPreserved ? 'Selectable' : 'Flattened'} />
        <Stat label="Saved" value={formatBytes(Math.max(originalBytes - compressedBytes, 0))} />
      </dl>

      {!result.textPreserved && (
        <p className="mt-5 text-[13px] leading-relaxed text-muted">
          Pages were redrawn as images, so the text in this file can no longer be selected, searched
          or read aloud. Keep your original if you need those.
        </p>
      )}
    </div>
  )
}

function Bar({
  label,
  value,
  widthPercent,
  tone,
}: {
  label: string
  value: string
  widthPercent: number
  tone: 'neutral' | 'accent' | 'danger'
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow">{label}</span>
        <span className="font-mono text-sm tabular-nums text-ink">{value}</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-line">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-300 ease-out',
            tone === 'neutral' && 'bg-line-strong',
            tone === 'accent' && 'bg-accent',
            tone === 'danger' && 'bg-danger',
          )}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 font-mono tabular-nums text-ink">{value}</dd>
    </div>
  )
}
