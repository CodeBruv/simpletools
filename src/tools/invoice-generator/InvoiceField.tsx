import { cn } from '@/lib/utils'

/**
 * Field primitives for the invoice editor.
 *
 * Extracted so the three fieldsets below share one labelled-input contract
 * rather than three near-identical ones. Every input has a real <label>, and
 * hints are tied to the control with aria-describedby so a screen reader reads
 * them in place instead of leaving them stranded.
 */

export const inputClass =
  'mt-1.5 h-11 w-full min-w-0 rounded-lg border border-line bg-canvas px-3 text-[15px] text-ink ' +
  'placeholder:text-subtle focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-accent'

export function Label({
  htmlFor,
  children,
  optional = false,
}: {
  htmlFor: string
  children: React.ReactNode
  optional?: boolean
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
      {children}
      {optional && <span className="ml-1.5 font-normal text-subtle">Optional</span>}
    </label>
  )
}

/** A single-line text input with its label and optional hint. */
export function TextField({
  id,
  label,
  value,
  onChange,
  optional = false,
  hint,
  placeholder,
  type = 'text',
  inputMode,
  autoComplete,
  className,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  optional?: boolean
  hint?: string
  placeholder?: string
  type?: 'text' | 'email' | 'tel' | 'url' | 'date'
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'decimal' | 'numeric'
  autoComplete?: string
  className?: string
}) {
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div className="min-w-0">
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>

      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hintId}
        className={cn(inputClass, className)}
      />

      {hint && (
        <p id={hintId} className="mt-1.5 text-[13px] leading-relaxed text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}

/** A multi-line input, used for addresses, notes and payment terms. */
export function TextAreaField({
  id,
  label,
  value,
  onChange,
  optional = false,
  hint,
  placeholder,
  rows = 3,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  optional?: boolean
  hint?: string
  placeholder?: string
  rows?: number
}) {
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div className="min-w-0">
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>

      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hintId}
        className={cn(inputClass, 'h-auto py-2.5 leading-relaxed')}
      />

      {hint && (
        <p id={hintId} className="mt-1.5 text-[13px] leading-relaxed text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}

/**
 * A numbered step panel.
 *
 * The numbers are the guidance: someone who has never made an invoice can
 * follow 1–4 down the page and reach a finished document without reading any
 * instructions.
 */
export function StepSection({
  step,
  title,
  hint,
  children,
}: {
  step: number
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-baseline gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full',
            'bg-accent-soft font-mono text-[12px] font-medium text-accent',
          )}
        >
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {hint && <p className="mt-1 text-[13px] leading-relaxed text-muted">{hint}</p>}
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  )
}
