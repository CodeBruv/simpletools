import { cn } from '@/lib/utils'
import { WIFI_SECURITIES } from '@/tools/qr-generator/payloads'
import type { QrFieldName, QrFields, QrType, WifiSecurity } from '@/tools/qr-generator/types'

/**
 * The input fields for whichever type is selected.
 *
 * Every field is a real labelled input. Errors are tied to their field with
 * aria-describedby and aria-invalid, so a screen reader announces the problem
 * on the control that caused it rather than leaving it stranded elsewhere.
 */

type Errors = Partial<Record<QrFieldName, string>>

const inputClass =
  'mt-1.5 h-11 w-full rounded-lg border bg-canvas px-3 text-[15px] text-ink placeholder:text-subtle ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function borderFor(error: string | undefined): string {
  return error ? 'border-danger' : 'border-line'
}

/** A labelled field with its optional hint and error, wired up for assistive tech. */
function Field({
  id,
  label,
  optional = false,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  optional?: boolean
  hint?: string
  error?: string
  children: (props: {
    id: string
    'aria-invalid': boolean | undefined
    'aria-describedby': string | undefined
  }) => React.ReactNode
}) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-subtle">Optional</span>}
      </label>

      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })}

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

export default function QrFieldset({
  type,
  fields,
  errors,
  onChange,
}: {
  type: QrType
  fields: QrFields
  errors: Errors
  onChange: <K extends QrFieldName>(field: K, value: QrFields[K]) => void
}) {
  switch (type) {
    case 'url':
      return (
        <Field id="qr-url" label="Web address" error={errors.url} hint="Opens when the code is scanned.">
          {(props) => (
            <input
              {...props}
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="example.com"
              value={fields.url}
              onChange={(event) => onChange('url', event.target.value)}
              className={cn(inputClass, borderFor(errors.url))}
            />
          )}
        </Field>
      )

    case 'text':
      return (
        <Field id="qr-text" label="Text" error={errors.text} hint="Shown as-is when the code is scanned.">
          {(props) => (
            <textarea
              {...props}
              rows={4}
              placeholder="Table 12 — back patio"
              value={fields.text}
              onChange={(event) => onChange('text', event.target.value)}
              className={cn(inputClass, borderFor(errors.text), 'h-auto py-2.5 leading-relaxed')}
            />
          )}
        </Field>
      )

    case 'email':
      return (
        <div className="space-y-4">
          <Field id="qr-email" label="Send to" error={errors.emailAddress}>
            {(props) => (
              <input
                {...props}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="hello@example.com"
                value={fields.emailAddress}
                onChange={(event) => onChange('emailAddress', event.target.value)}
                className={cn(inputClass, borderFor(errors.emailAddress))}
              />
            )}
          </Field>

          <Field id="qr-email-subject" label="Subject" optional error={errors.emailSubject}>
            {(props) => (
              <input
                {...props}
                type="text"
                placeholder="Order enquiry"
                value={fields.emailSubject}
                onChange={(event) => onChange('emailSubject', event.target.value)}
                className={cn(inputClass, borderFor(errors.emailSubject))}
              />
            )}
          </Field>

          <Field
            id="qr-email-body"
            label="Message"
            optional
            error={errors.emailBody}
            hint="Fills in the email. The person can still edit it before sending."
          >
            {(props) => (
              <textarea
                {...props}
                rows={3}
                placeholder="Hi, I'd like to ask about…"
                value={fields.emailBody}
                onChange={(event) => onChange('emailBody', event.target.value)}
                className={cn(inputClass, borderFor(errors.emailBody), 'h-auto py-2.5 leading-relaxed')}
              />
            )}
          </Field>
        </div>
      )

    case 'phone':
      return (
        <Field
          id="qr-phone"
          label="Phone number"
          error={errors.phone}
          hint="Include the country code so it works from anywhere."
        >
          {(props) => (
            <input
              {...props}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+1 555 123 4567"
              value={fields.phone}
              onChange={(event) => onChange('phone', event.target.value)}
              className={cn(inputClass, borderFor(errors.phone))}
            />
          )}
        </Field>
      )

    case 'sms':
      return (
        <div className="space-y-4">
          <Field id="qr-sms-phone" label="Phone number" error={errors.smsPhone}>
            {(props) => (
              <input
                {...props}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+1 555 123 4567"
                value={fields.smsPhone}
                onChange={(event) => onChange('smsPhone', event.target.value)}
                className={cn(inputClass, borderFor(errors.smsPhone))}
              />
            )}
          </Field>

          <Field
            id="qr-sms-message"
            label="Message"
            optional
            error={errors.smsMessage}
            hint="Fills in the text. The person still has to press send."
          >
            {(props) => (
              <textarea
                {...props}
                rows={3}
                placeholder="I'd like to book a table"
                value={fields.smsMessage}
                onChange={(event) => onChange('smsMessage', event.target.value)}
                className={cn(inputClass, borderFor(errors.smsMessage), 'h-auto py-2.5 leading-relaxed')}
              />
            )}
          </Field>
        </div>
      )

    case 'wifi':
      return (
        <div className="space-y-4">
          <Field
            id="qr-wifi-ssid"
            label="Network name"
            error={errors.wifiSsid}
            hint="Must match the name exactly, including capital letters."
          >
            {(props) => (
              <input
                {...props}
                type="text"
                placeholder="Cafe Guest"
                value={fields.wifiSsid}
                onChange={(event) => onChange('wifiSsid', event.target.value)}
                className={cn(inputClass, borderFor(errors.wifiSsid))}
              />
            )}
          </Field>

          <div>
            <label htmlFor="qr-wifi-security" className="text-sm font-medium text-ink">
              Security
            </label>
            <select
              id="qr-wifi-security"
              value={fields.wifiSecurity}
              onChange={(event) => onChange('wifiSecurity', event.target.value as WifiSecurity)}
              className={cn(inputClass, 'border-line')}
            >
              {WIFI_SECURITIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {fields.wifiSecurity !== 'nopass' && (
            <Field id="qr-wifi-password" label="Password" error={errors.wifiPassword}>
              {(props) => (
                <input
                  {...props}
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Network password"
                  value={fields.wifiPassword}
                  onChange={(event) => onChange('wifiPassword', event.target.value)}
                  className={cn(inputClass, borderFor(errors.wifiPassword), 'font-mono')}
                />
              )}
            </Field>
          )}

          <label
            className={cn(
              'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-line px-3',
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-2',
              'has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
            )}
          >
            <input
              type="checkbox"
              checked={fields.wifiHidden}
              onChange={(event) => onChange('wifiHidden', event.target.checked)}
              className="size-4 shrink-0 accent-accent"
            />
            <span className="text-sm text-ink">This network is hidden</span>
          </label>
        </div>
      )
  }
}
