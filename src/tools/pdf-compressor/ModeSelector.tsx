import { AlertTriangle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { MAX_QUALITY, MIN_QUALITY } from '@/tools/pdf-compressor/compressPdf'
import type { CompressionMode } from '@/tools/pdf-compressor/types'

const OPTIONS: ReadonlyArray<{
  value: CompressionMode
  label: string
  detail: string
}> = [
  {
    value: 'lossless',
    label: 'Keep text selectable',
    detail: 'Rebuilds the file structure. Nothing is re-encoded, so quality is untouched.',
  },
  {
    value: 'rasterise',
    label: 'Stronger compression',
    detail: 'Redraws each page as an image. Much smaller, but the text stops being text.',
  },
]

/**
 * Mode picker plus the quality control that only one mode uses.
 *
 * Real radio inputs rather than styled buttons, so arrow keys move between the
 * options and screen readers announce the group and the current choice.
 */
export default function ModeSelector({
  mode,
  onModeChange,
  quality,
  onQualityChange,
  disabled = false,
}: {
  mode: CompressionMode
  onModeChange: (mode: CompressionMode) => void
  quality: number
  onQualityChange: (quality: number) => void
  disabled?: boolean
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="eyebrow">Compression</legend>

      <div className="mt-3 space-y-2">
        {OPTIONS.map((option) => {
          const active = mode === option.value

          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2',
                'has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                active ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-line-strong',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="radio"
                name="pdf-compression-mode"
                value={option.value}
                checked={active}
                onChange={() => onModeChange(option.value)}
                className="mt-0.5 size-4 shrink-0 accent-accent"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{option.label}</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">
                  {option.detail}
                </span>
              </span>
            </label>
          )
        })}
      </div>

      {mode === 'rasterise' && (
        <div className="mt-4">
          <p
            role="note"
            className="flex items-start gap-2 rounded-lg bg-danger-soft p-3 text-[13px] leading-relaxed text-danger"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span>
              Text in the result will not be selectable, searchable, or readable by a screen reader.
            </span>
          </p>

          <div className="mt-4">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="pdf-quality" className="text-sm font-medium text-ink">
                Page quality
              </label>
              <span className="font-mono text-sm tabular-nums text-muted">
                {Math.round(quality * 100)}%
              </span>
            </div>
            <input
              id="pdf-quality"
              type="range"
              min={MIN_QUALITY * 100}
              max={MAX_QUALITY * 100}
              step={5}
              value={Math.round(quality * 100)}
              onChange={(event) => onQualityChange(Number(event.target.value) / 100)}
              className="mt-2 w-full accent-accent"
            />
          </div>
        </div>
      )}
    </fieldset>
  )
}
