import type { ErrorCorrectionLevel } from '@/tools/qr-generator/qrEncoder'

/** What the QR code stands for. Drives which fields the form shows. */
export type QrType = 'url' | 'text' | 'email' | 'phone' | 'sms' | 'wifi'

/** Wi-Fi authentication, as the Wi-Fi QR format spells it. */
export type WifiSecurity = 'WPA' | 'WEP' | 'nopass'

/**
 * Every field the form can hold, for every type.
 *
 * One flat record rather than a discriminated union per type: switching type
 * keeps whatever the user already typed, so flipping from URL to Text and back
 * does not silently erase their work.
 */
export interface QrFields {
  url: string
  text: string
  emailAddress: string
  emailSubject: string
  emailBody: string
  phone: string
  smsPhone: string
  smsMessage: string
  wifiSsid: string
  wifiPassword: string
  wifiSecurity: WifiSecurity
  wifiHidden: boolean
}

/** Which field a validation message belongs to, so it renders next to it. */
export type QrFieldName = keyof QrFields

export interface QrValidationError {
  field: QrFieldName
  message: string
}

/** A payload ready to encode, or the reasons it is not ready yet. */
export type QrPayloadResult =
  | { ok: true; payload: string }
  | { ok: false; errors: readonly QrValidationError[] }

export interface QrAppearance {
  /** Rendered PNG edge length in pixels. */
  size: number
  /** Quiet zone in modules. Four is the standard minimum. */
  margin: number
  errorCorrection: ErrorCorrectionLevel
  foreground: string
  background: string
}
