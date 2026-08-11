import { AlertTriangle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { ERROR_CORRECTION_LEVELS, type ErrorCorrectionLevel } from '@/tools/qr-generator/qrEncoder'
import { MAX_MARGIN, MIN_MARGIN, SIZE_OPTIONS, appearanceWarning } from '@/tools/qr-generator/render'
import type { QrAppearance } from '@/tools/qr-generator/types'

/**
 * Size, quiet zone, error correction and the two colours.
 *
 * Deliberately the whole list. Anything more decorative — logos, gradients,
 * custom module shapes — trades scan reliability for looks, and a QR code that
 * does not scan is worthless however good it looks.
 *
 * Colours use a native colour input paired with a text field, because the
 * swatch alone gives a screen reader nothing to read out and cannot be typed
 * into.
 */

const CORRECTION_LABELS: Record<ErrorCorrectionLevel, string> = {
  L: 'Low',
  M: 'Standard',
  Q: 'High',
  H: 'Highest',
}

const CORRECTION_HINT: Record<ErrorCorrectionLevel, string> = {
  L: 'Smallest code. Best for a clean screen or paper.',
  M: 'A good balance for most uses.',
  Q: 'Survives more smudging and creasing.',
  H: 'Most robust. Good for stickers and outdoor signs.',
}

const HEX_PATTERN = /^#[0-9a-f]{6}$/i

function ColourControl({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>

      <div className="mt-1.5 flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'size-11 shrink-0 cursor-pointer rounded-lg border border-line bg-canvas p-1',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            'focus-visible:outline-accent',
          )}
        />
        <input
          type="text"
          value={value}
          aria-label={`${label} hex code`}
          spellCheck={false}
          onChange={(event) => {
            const next = event.target.value
            // Typing is always allowed; the value only propagates once it is a
            // complete colour, so a half-typed hex never blanks the preview.
            if (HEX_PATTERN.test(next)) onChange(next.toLowerCase())
          }}
          className={cn(
            'h-11 min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 font-mono text-sm',
            'text-ink focus-visible:outline focus-visible:outline-2',
            'focus-visible:outline-offset-2 focus-visible:outline-accent',
          )}
        />
      </div>
    </div>
  )
}

export default function AppearanceControls({
  appearance,
  onChange,
}: {
  appearance: QrAppearance
  onChange: <K extends keyof QrAppearance>(key: K, value: QrAppearance[K]) => void
}) {
  const warning = appearanceWarning(appearance.foreground, appearance.background)

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="qr-size" className="text-sm font-medium text-ink">
          Image size
        </label>
        <select
          id="qr-size"
          value={appearance.size}
          onChange={(event) => onChange('size', Number(event.target.value))}
          className={cn(
            'mt-1.5 h-11 w-full rounded-lg border border-line bg-canvas px-3 text-[15px] text-ink',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            'focus-visible:outline-accent',
          )}
        >
          {SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} × {size} pixels
            </option>
          ))}
        </select>
      </div>

      <fieldset className="min-w-0">
        <legend className="text-sm font-medium text-ink">Error correction</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ERROR_CORRECTION_LEVELS.map((level) => {
            const active = appearance.errorCorrection === level

            return (
              <label
                key={level}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3 transition-colors',
                  'has-[:focus-visible]:outline has-[:focus-visible]:outline-2',
                  'has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                  active
                    ? 'border-accent bg-accent-soft'
                    : 'border-line bg-surface hover:border-line-strong',
                )}
              >
                <input
                  type="radio"
                  name="qr-error-correction"
                  value={level}
                  checked={active}
                  onChange={() => onChange('errorCorrection', level)}
                  className="size-4 shrink-0 accent-accent"
                />
                <span className="text-sm text-ink">{CORRECTION_LABELS[level]}</span>
              </label>
            )
          })}
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          {CORRECTION_HINT[appearance.errorCorrection]}
        </p>
      </fieldset>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="qr-margin" className="text-sm font-medium text-ink">
            Border
          </label>
          <span className="font-mono text-sm tabular-nums text-muted">
            {appearance.margin} {appearance.margin === 1 ? 'square' : 'squares'}
          </span>
        </div>
        <input
          id="qr-margin"
          type="range"
          min={MIN_MARGIN}
          max={MAX_MARGIN}
          step={1}
          value={appearance.margin}
          onChange={(event) => onChange('margin', Number(event.target.value))}
          className="mt-2 w-full accent-accent"
        />
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Scanners need clear space around the code. Four is the usual amount.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ColourControl
          id="qr-foreground"
          label="Code colour"
          value={appearance.foreground}
          onChange={(value) => onChange('foreground', value)}
        />
        <ColourControl
          id="qr-background"
          label="Background"
          value={appearance.background}
          onChange={(value) => onChange('background', value)}
        />
      </div>

      {warning && (
        <p
          role="note"
          className="flex items-start gap-2 rounded-lg bg-danger-soft p-3 text-[13px] leading-relaxed text-danger"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          <span>{warning}</span>
        </p>
      )}
    </div>
  )
}
