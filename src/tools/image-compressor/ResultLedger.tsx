import { AlertTriangle, Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatBytes, formatPercent, getExtension } from '@/lib/file'
import type { CompressionResult } from '@/tools/image-compressor/types'

const LABEL_BY_MIME: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
}

/**
 * The result readout.
 *
 * The signature device here is that the two bars are drawn to scale against
 * each other, so the saving is something you see before you read it. Every
 * measurement is set in mono and tabular so figures don't jitter while the
 * quality slider moves.
 */
export default function ResultLedger({
  result,
  filename,
  busy,
}: {
  result: CompressionResult
  filename: string
  busy: boolean
}) {
  const { originalBytes, compressedBytes, didHelp } = result

  // Clamped so a result that grew still renders a sane bar.
  const ratio = originalBytes > 0 ? Math.min(compressedBytes / originalBytes, 1) : 0
  const outputLabel = LABEL_BY_MIME[result.mimeType] ?? result.mimeType
  const inputLabel = getExtension(filename).toUpperCase().replace('JPEG', 'JPG')
  const formatChanged = inputLabel !== outputLabel.toUpperCase()

  return (
    <div className={cn('transition-opacity duration-150', busy && 'opacity-60')}>
      <p className="truncate font-mono text-[13px] text-muted" title={filename}>
        {filename}
      </p>

      <div className="mt-5 space-y-4">
        <Bar
          label="Original"
          value={formatBytes(originalBytes)}
          widthPercent={100}
          tone="neutral"
        />
        <Bar
          label="Compressed"
          value={formatBytes(compressedBytes)}
          widthPercent={Math.max(ratio * 100, 1.5)}
          tone={didHelp ? 'accent' : 'danger'}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line pt-5">
        {didHelp ? (
          <>
            <span className="flex items-center gap-2 text-accent">
              <Check className="size-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
                {formatPercent(result.reductionPercent)}
              </span>
            </span>
            <span className="text-[15px] text-muted">smaller than the original</span>
          </>
        ) : (
          <span className="flex items-start gap-2 text-[15px] leading-relaxed text-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span>
              This came out {formatBytes(compressedBytes - originalBytes)} larger. The original is
              already well compressed — lower the quality, or keep the file you have.
            </span>
          </span>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] sm:grid-cols-3">
        <Stat label="Dimensions" value={`${result.width} × ${result.height}`} />
        <Stat label="Output format" value={outputLabel} />
        <Stat label="Saved" value={formatBytes(Math.max(originalBytes - compressedBytes, 0))} />
      </dl>

      {(formatChanged || result.wasDownscaled) && (
        <div className="mt-5 space-y-1.5 text-[13px] leading-relaxed text-muted">
          {formatChanged && (
            <p>
              Saved as {outputLabel} rather than {inputLabel}
              {inputLabel === 'PNG'
                ? '. PNG compression is lossless, so re-saving a PNG as PNG makes it bigger, not smaller.'
                : '.'}
            </p>
          )}
          {result.wasDownscaled && (
            <p>
              Scaled down from {result.originalWidth} × {result.originalHeight} to stay within the
              canvas limit your browser allows.
            </p>
          )}
        </div>
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
