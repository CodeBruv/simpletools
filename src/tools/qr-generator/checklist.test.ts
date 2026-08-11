import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { EMPTY_FIELDS, buildPayload, downloadName } from '@/tools/qr-generator/payloads'
import { encodeQr } from '@/tools/qr-generator/qrEncoder'
import { decodeMatrix } from '@/tools/qr-generator/testDecoder'

/**
 * The manual test checklist, executed.
 *
 * These are the exact values handed over for the browser pass. Running them
 * here means the checklist cannot quietly go stale: if someone changes an
 * escaping rule or a validation message, the instructions I gave fail with it.
 *
 * A scanner still has to confirm the printed pattern — that part needs a
 * camera — but everything up to the pattern is pinned here.
 */

/** Encode, then read the symbol back, exactly as a scanner would see it. */
function roundTrip(payload: string): string {
  return decodeMatrix(encodeQr(payload, { errorCorrection: 'M' }))
}

describe('checklist: what each entry should scan as', () => {
  const CASES: ReadonlyArray<[string, () => ReturnType<typeof buildPayload>, string]> = [
    [
      'Link',
      () => buildPayload('url', { ...EMPTY_FIELDS, url: 'simpletools.example/menu' }),
      'https://simpletools.example/menu',
    ],
    [
      'Text',
      () => buildPayload('text', { ...EMPTY_FIELDS, text: 'Table 12 — back patio' }),
      'Table 12 — back patio',
    ],
    [
      'Email',
      () =>
        buildPayload('email', {
          ...EMPTY_FIELDS,
          emailAddress: 'hello@example.com',
          emailSubject: 'Table booking',
          emailBody: 'Hi, I would like a table for four on Friday.',
        }),
      'mailto:hello@example.com?subject=Table%20booking&body=Hi%2C%20I%20would%20like%20a%20table%20for%20four%20on%20Friday.',
    ],
    [
      'Phone',
      () => buildPayload('phone', { ...EMPTY_FIELDS, phone: '+1 (555) 123-4567' }),
      'tel:+15551234567',
    ],
    [
      'SMS',
      () =>
        buildPayload('sms', {
          ...EMPTY_FIELDS,
          smsPhone: '+1 (555) 123-4567',
          smsMessage: 'Table 12 needs the bill, please',
        }),
      'SMSTO:+15551234567:Table 12 needs the bill, please',
    ],
    [
      'Wi-Fi',
      () =>
        buildPayload('wifi', {
          ...EMPTY_FIELDS,
          wifiSsid: 'Joe;s Cafe',
          wifiPassword: 'flat:white,2024',
          wifiSecurity: 'WPA',
        }),
      'WIFI:T:WPA;S:Joe\\;s Cafe;P:flat\\:white\\,2024;;',
    ],
  ]

  for (const [label, build, expected] of CASES) {
    test(`${label} builds and scans back to the documented value`, () => {
      const result = build()
      assert.ok(result.ok, `${label} was rejected by validation`)
      assert.equal(result.payload, expected)
      assert.equal(roundTrip(result.payload), expected)
    })
  }
})

describe('checklist: the invalid-input step', () => {
  test('"not a link" is refused, in plain language', () => {
    const result = buildPayload('url', { ...EMPTY_FIELDS, url: 'not a link' })

    assert.ok(!result.ok, 'the checklist claims this is rejected, but it was accepted')
    const message = result.errors[0]?.message ?? ''
    assert.ok(message.length > 0)
    assert.doesNotMatch(message, /undefined|null|NaN|Error:|regex|payload|codeword/i)
  })

  test('an empty form is refused rather than encoding nothing', () => {
    assert.ok(!buildPayload('url', EMPTY_FIELDS).ok)
  })
})

describe('checklist: downloaded filenames', () => {
  test('files are named by type, never by content', () => {
    assert.equal(downloadName('url', 'png'), 'qr-code-link.png')
    assert.equal(downloadName('wifi', 'svg'), 'qr-code-wifi.svg')
  })
})
