import type {
  QrFields,
  QrPayloadResult,
  QrType,
  QrValidationError,
  WifiSecurity,
} from '@/tools/qr-generator/types'

/**
 * Turns form fields into the string that goes inside the QR code.
 *
 * The payload formats here are conventions that scanner apps recognise, not a
 * single tidy standard, so each builder notes what it follows. Getting the
 * escaping right matters more than it looks: a Wi-Fi password containing a
 * semicolon will silently join the wrong network — or none — if it is pasted
 * in raw.
 */

export const QR_TYPES: ReadonlyArray<{ value: QrType; label: string; hint: string }> = [
  { value: 'url', label: 'Website', hint: 'Open a link' },
  { value: 'text', label: 'Text', hint: 'Show a message' },
  { value: 'email', label: 'Email', hint: 'Start an email' },
  { value: 'phone', label: 'Phone', hint: 'Call a number' },
  { value: 'sms', label: 'SMS', hint: 'Send a text' },
  { value: 'wifi', label: 'Wi-Fi', hint: 'Join a network' },
] as const

export const WIFI_SECURITIES: ReadonlyArray<{ value: WifiSecurity; label: string }> = [
  { value: 'WPA', label: 'WPA/WPA2' },
  { value: 'WEP', label: 'WEP' },
  { value: 'nopass', label: 'No password' },
] as const

export const EMPTY_FIELDS: QrFields = {
  url: '',
  text: '',
  emailAddress: '',
  emailSubject: '',
  emailBody: '',
  phone: '',
  smsPhone: '',
  smsMessage: '',
  wifiSsid: '',
  wifiPassword: '',
  wifiSecurity: 'WPA',
  wifiHidden: false,
}

/** Fields each type actually reads, so the form only shows what it needs. */
export const FIELDS_BY_TYPE: Record<QrType, readonly (keyof QrFields)[]> = {
  url: ['url'],
  text: ['text'],
  email: ['emailAddress', 'emailSubject', 'emailBody'],
  phone: ['phone'],
  sms: ['smsPhone', 'smsMessage'],
  wifi: ['wifiSsid', 'wifiPassword', 'wifiSecurity', 'wifiHidden'],
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

/**
 * Deliberately loose. A stricter pattern rejects addresses that are perfectly
 * valid, and the QR code cannot verify a mailbox anyway — this only catches
 * the typo where someone leaves out the @ or the domain.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

/**
 * Phone numbers are checked by what they contain, not by their shape.
 *
 * People write the same number as `+1 (555) 123-4567`, `555-123-4567` or
 * `020 7946 0958`, and a pattern that fixes the punctuation order rejects
 * perfectly dialable numbers. So: only digits and the punctuation people
 * actually type, and enough digits to be a real number.
 */
const PHONE_ALLOWED = /^[+0-9\s\-().]+$/
const MIN_PHONE_DIGITS = 4

function isPlausiblePhone(raw: string): boolean {
  const trimmed = raw.trim()
  if (!PHONE_ALLOWED.test(trimmed)) return false

  // A + is a country-code prefix, so it only makes sense at the front.
  const plusCount = (trimmed.match(/\+/g) ?? []).length
  if (plusCount > 1 || (plusCount === 1 && !trimmed.startsWith('+'))) return false

  return trimmed.replace(/[^0-9]/g, '').length >= MIN_PHONE_DIGITS
}

/**
 * A URL is accepted with or without a scheme, because people type
 * "example.com". Anything without a dot or a scheme is almost certainly not a
 * web address and is worth flagging before it becomes an unscannable QR.
 */
function normaliseUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withScheme)
    if (!url.hostname.includes('.') && url.protocol.startsWith('http')) return null
    return url.href
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ *
 * Escaping
 * ------------------------------------------------------------------ */

/**
 * Wi-Fi payload escaping.
 *
 * The format uses `;` between fields and `:` between key and value, so those
 * characters — plus `,` and the backslash itself — have to be escaped inside a
 * value. An SSID or password containing any of them is common enough
 * (`Joe's Cafe; Guest`) that skipping this would be a real bug, not a nicety.
 */
export function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

/* ------------------------------------------------------------------ *
 * Payload builders
 * ------------------------------------------------------------------ */

function buildEmail(fields: QrFields): string {
  // RFC 6068: the address is unencoded in the path, headers are query
  // parameters with percent-encoding. encodeURIComponent leaves the few
  // characters mail clients expect to see literally, which is what we want.
  const params: string[] = []
  const subject = fields.emailSubject.trim()
  const body = fields.emailBody.trim()

  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)

  const query = params.length > 0 ? `?${params.join('&')}` : ''
  return `mailto:${fields.emailAddress.trim()}${query}`
}

/** Strips the spacing people type, keeping a leading +. */
function normalisePhone(raw: string): string {
  const trimmed = raw.trim()
  const digits = trimmed.replace(/[^0-9]/g, '')
  return trimmed.startsWith('+') ? `+${digits}` : digits
}

function buildWifi(fields: QrFields): string {
  const parts = [`T:${fields.wifiSecurity}`, `S:${escapeWifiValue(fields.wifiSsid.trim())}`]

  if (fields.wifiSecurity !== 'nopass') {
    parts.push(`P:${escapeWifiValue(fields.wifiPassword)}`)
  }

  // Only emitted when true: some Android versions mishandle `H:false`.
  if (fields.wifiHidden) parts.push('H:true')

  return `WIFI:${parts.join(';')};;`
}

/**
 * Build the payload for the selected type, or report what is missing.
 *
 * Returns every problem at once rather than the first, so a form with two
 * empty required fields flags both instead of making the user fix them one at
 * a time.
 */
export function buildPayload(type: QrType, fields: QrFields): QrPayloadResult {
  const errors: QrValidationError[] = []
  const fail = (field: keyof QrFields, message: string) => errors.push({ field, message })

  switch (type) {
    case 'url': {
      const url = normaliseUrl(fields.url)
      if (!fields.url.trim()) fail('url', 'Enter the web address you want the code to open.')
      else if (!url) fail('url', "That doesn't look like a web address. Try something like example.com.")
      if (errors.length === 0 && url) return { ok: true, payload: url }
      break
    }

    case 'text': {
      const text = fields.text.trim()
      if (!text) fail('text', 'Enter the text you want the code to show.')
      else return { ok: true, payload: text }
      break
    }

    case 'email': {
      const address = fields.emailAddress.trim()
      if (!address) fail('emailAddress', 'Enter the email address the message should go to.')
      else if (!EMAIL_PATTERN.test(address)) {
        fail('emailAddress', "That doesn't look like an email address. Check for a missing @ or domain.")
      }
      if (errors.length === 0) return { ok: true, payload: buildEmail(fields) }
      break
    }

    case 'phone': {
      const phone = fields.phone.trim()
      if (!phone) fail('phone', 'Enter the phone number the code should call.')
      else if (!isPlausiblePhone(phone)) {
        fail('phone', 'Enter a phone number using digits, and + for the country code.')
      }
      if (errors.length === 0) return { ok: true, payload: `tel:${normalisePhone(phone)}` }
      break
    }

    case 'sms': {
      const phone = fields.smsPhone.trim()
      if (!phone) fail('smsPhone', 'Enter the phone number the text should go to.')
      else if (!isPlausiblePhone(phone)) {
        fail('smsPhone', 'Enter a phone number using digits, and + for the country code.')
      }

      if (errors.length === 0) {
        // SMSTO: is the form Android and most scanner apps handle; the message
        // follows a second colon and may be omitted entirely.
        const message = fields.smsMessage.trim()
        const payload = message
          ? `SMSTO:${normalisePhone(phone)}:${message}`
          : `SMSTO:${normalisePhone(phone)}`
        return { ok: true, payload }
      }
      break
    }

    case 'wifi': {
      const ssid = fields.wifiSsid.trim()
      if (!ssid) fail('wifiSsid', 'Enter the network name exactly as it appears on the device.')

      if (fields.wifiSecurity !== 'nopass' && !fields.wifiPassword) {
        fail('wifiPassword', 'Enter the network password, or choose "No password" above.')
      }

      if (errors.length === 0) return { ok: true, payload: buildWifi(fields) }
      break
    }
  }

  return { ok: false, errors }
}

/** Filename stem per type. Never derived from what the user typed. */
export function downloadName(type: QrType, extension: 'png' | 'svg'): string {
  const stem: Record<QrType, string> = {
    url: 'qr-code-link',
    text: 'qr-code-text',
    email: 'qr-code-email',
    phone: 'qr-code-phone',
    sms: 'qr-code-sms',
    wifi: 'qr-code-wifi',
  }

  return `${stem[type]}.${extension}`
}
