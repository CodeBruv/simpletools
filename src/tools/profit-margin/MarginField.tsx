import { cn } from '@/lib/utils'

/**
 * One labelled numeric field, with its unit shown beside the box.
 *
 * The input is `type="text"` with `inputMode="decimal"` rather than
 * `type="number"`. A number input silently rejects "100,000", which is how
 * people type and paste money and how this product prints it, and its spinner
 * buttons are a hazard on a price field. The decimal input mode still brings up
 * the numeric keypad on a phone.
 *
 * What the user typed is stored exactly as typed and never rewritten between
 * keystrokes: reformatting live is what moves the caret to the end of the box
 * mid-edit and makes a field feel like it is fighting back.
 *
 * The unit sits outside the input in its own cell, so a one-character "$" and a
 * three-character "CHF" both line up without measuring anything.
 */
export default function MarginField({
  id,
  label,
  unitLabel,
  prefix,
  suffix,
  value,
  onChange,
  hint,
  error,
  placeholder,
}: {
  id: string
  label: string
  /** Spoken unit, e.g. "in Nigerian Naira" — the visible symbol is decorative. */
  unitLabel: string
  prefix?: string
  suffix?: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string | null
  placeholder?: string
}) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        <span className="sr-only"> {unitLabel}</span>
      </label>

      <div
        className={cn(
          'mt-1.5 flex items-stretch overflow-hidden rounded-lg border bg-canvas',
          'has-[:focus-visible]:outline has-[:focus-visible]:outline-2',
          'has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
          error ? 'border-danger' : 'border-line',
        )}
      >
        {prefix && (
          <span
            aria-hidden="true"
            className="flex shrink-0 items-center pl-3 text-[15px] text-muted"
          >
            {prefix}
          </span>
        )}

        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full min-w-0 bg-transparent px-3 text-[15px] text-ink',
            'placeholder:text-subtle focus:outline-none',
            prefix && 'pl-2',
            suffix && 'pr-2',
          )}
        />

        {suffix && (
          <span
            aria-hidden="true"
            className="flex shrink-0 items-center pr-3 text-[15px] text-muted"
          >
            {suffix}
          </span>
        )}
      </div>

      {error && (
        <p id={errorId} className="mt-1.5 text-[13px] leading-relaxed text-danger">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[13px] leading-relaxed text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
