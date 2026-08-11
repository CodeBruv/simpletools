import { TextAreaField, TextField } from './InvoiceField'
import type { Party } from './types'

/**
 * The two address blocks. One component for both sides, because an invoice
 * asks the same questions of the sender and the recipient — only the labels and
 * the website field differ.
 */

export default function PartyFields({
  idPrefix,
  party,
  onChange,
  nameLabel,
  namePlaceholder,
  nameHint,
  includeWebsite = false,
}: {
  idPrefix: string
  party: Party
  onChange: (patch: Partial<Party>) => void
  nameLabel: string
  namePlaceholder: string
  nameHint?: string
  includeWebsite?: boolean
}) {
  return (
    <div className="space-y-4">
      <TextField
        id={`${idPrefix}-name`}
        label={nameLabel}
        value={party.name}
        onChange={(name) => onChange({ name })}
        placeholder={namePlaceholder}
        hint={nameHint}
        autoComplete="organization"
      />

      <TextAreaField
        id={`${idPrefix}-address`}
        label="Address"
        optional
        value={party.address}
        onChange={(address) => onChange({ address })}
        placeholder={'12 Marina Road\nLagos Island, Lagos'}
        rows={2}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id={`${idPrefix}-email`}
          label="Email"
          optional
          type="email"
          inputMode="email"
          autoComplete="email"
          value={party.email}
          onChange={(email) => onChange({ email })}
          placeholder="hello@example.com"
        />

        <TextField
          id={`${idPrefix}-phone`}
          label="Phone"
          optional
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={party.phone}
          onChange={(phone) => onChange({ phone })}
          placeholder="+234 800 000 0000"
        />
      </div>

      {includeWebsite && (
        <TextField
          id={`${idPrefix}-website`}
          label="Website"
          optional
          type="url"
          inputMode="url"
          autoComplete="url"
          value={party.website ?? ''}
          onChange={(website) => onChange({ website })}
          placeholder="example.com"
        />
      )}
    </div>
  )
}
