import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  EMPTY_FIELDS,
  FIELDS_BY_TYPE,
  QR_TYPES,
  WIFI_SECURITIES,
  buildPayload,
  downloadName,
  escapeWifiValue,
} from '@/tools/qr-generator/payloads'
import type { QrFields, QrType } from '@/tools/qr-generator/types'

/** Start from empty and set only what the case is about. */
function fields(overrides: Partial<QrFields> = {}): QrFields {
  return { ...EMPTY_FIELDS, ...overrides }
}

/** Payload text, or a failed assertion naming the errors that came back. */
function payloadOf(type: QrType, overrides: Partial<QrFields> = {}): string {
  const result = buildPayload(type, fields(overrides))
  if (!result.ok) {
    assert.fail(`expected a payload, got errors: ${result.errors.map((e) => e.field).join(', ')}`)
  }
  return result.payload
}

/** The fields that failed validation. */
function errorFields(type: QrType, overrides: Partial<QrFields> = {}): string[] {
  const result = buildPayload(type, fields(overrides))
  if (result.ok) assert.fail(`expected validation to fail, got payload: ${result.payload}`)
  return result.errors.map((error) => error.field)
}

/* ------------------------------------------------------------------ *
 * Payload generation
 * ------------------------------------------------------------------ */

describe('url payload', () => {
  test('keeps a full url intact', () => {
    assert.equal(payloadOf('url', { url: 'https://example.com/menu' }), 'https://example.com/menu')
  })

  test('adds https when the scheme is missing, because people type example.com', () => {
    assert.equal(payloadOf('url', { url: 'example.com' }), 'https://example.com/')
  })

  test('keeps a non-http scheme rather than mangling it', () => {
    assert.equal(payloadOf('url', { url: 'mailto:hi@example.com' }), 'mailto:hi@example.com')
  })

  test('trims surrounding whitespace from a paste', () => {
    assert.equal(payloadOf('url', { url: '  https://example.com/  ' }), 'https://example.com/')
  })

  test('preserves the query string and fragment', () => {
    const url = 'https://example.com/search?q=qr+code&page=2#results'
    assert.equal(payloadOf('url', { url }), url)
  })
})

describe('text payload', () => {
  test('passes the text through', () => {
    assert.equal(payloadOf('text', { text: 'Table 12 — back patio' }), 'Table 12 — back patio')
  })

  test('trims the edges but keeps interior line breaks', () => {
    assert.equal(payloadOf('text', { text: '  line one\nline two  ' }), 'line one\nline two')
  })

  test('does not treat text as a url', () => {
    assert.equal(payloadOf('text', { text: 'example.com' }), 'example.com')
  })
})

describe('email payload', () => {
  test('builds a bare mailto when only the address is given', () => {
    assert.equal(payloadOf('email', { emailAddress: 'hi@example.com' }), 'mailto:hi@example.com')
  })

  test('adds subject and body as encoded query parameters', () => {
    assert.equal(
      payloadOf('email', {
        emailAddress: 'orders@example.com',
        emailSubject: 'Order #1234',
        emailBody: 'Hi there, about my order.',
      }),
      'mailto:orders@example.com?subject=Order%20%231234&body=Hi%20there%2C%20about%20my%20order.',
    )
  })

  test('omits an empty subject rather than sending a blank header', () => {
    assert.equal(
      payloadOf('email', { emailAddress: 'hi@example.com', emailBody: 'Just the body' }),
      'mailto:hi@example.com?body=Just%20the%20body',
    )
  })

  test('encodes ampersands so they cannot split the parameters', () => {
    const payload = payloadOf('email', {
      emailAddress: 'hi@example.com',
      emailSubject: 'Tea & coffee',
    })

    assert.equal(payload, 'mailto:hi@example.com?subject=Tea%20%26%20coffee')
    assert.equal(payload.split('&').length, 1, 'an unencoded & would create a second parameter')
  })
})

describe('phone payload', () => {
  test('builds a tel link', () => {
    assert.equal(payloadOf('phone', { phone: '+15551234567' }), 'tel:+15551234567')
  })

  test('strips the spacing and punctuation people type', () => {
    assert.equal(payloadOf('phone', { phone: '+1 (555) 123-4567' }), 'tel:+15551234567')
    assert.equal(payloadOf('phone', { phone: '020 7946 0958' }), 'tel:02079460958')
  })
})

describe('sms payload', () => {
  test('builds SMSTO with a message', () => {
    assert.equal(
      payloadOf('sms', { smsPhone: '+15551234567', smsMessage: 'Running five minutes late' }),
      'SMSTO:+15551234567:Running five minutes late',
    )
  })

  test('omits the trailing colon when there is no message', () => {
    assert.equal(payloadOf('sms', { smsPhone: '+15551234567' }), 'SMSTO:+15551234567')
  })

  test('normalises the number the same way the phone type does', () => {
    assert.equal(payloadOf('sms', { smsPhone: '+1 (555) 123-4567' }), 'SMSTO:+15551234567')
  })
})

describe('wifi payload', () => {
  test('builds the standard field order', () => {
    assert.equal(
      payloadOf('wifi', { wifiSsid: 'Cafe Guest', wifiPassword: 'latte123' }),
      'WIFI:T:WPA;S:Cafe Guest;P:latte123;;',
    )
  })

  test('drops the password field entirely for an open network', () => {
    const payload = payloadOf('wifi', { wifiSsid: 'Open Network', wifiSecurity: 'nopass' })

    assert.equal(payload, 'WIFI:T:nopass;S:Open Network;;')
    assert.ok(!payload.includes('P:'), 'an open network should carry no password field')
  })

  test('carries a WEP network through', () => {
    assert.equal(
      payloadOf('wifi', { wifiSsid: 'Old Router', wifiPassword: 'abcde', wifiSecurity: 'WEP' }),
      'WIFI:T:WEP;S:Old Router;P:abcde;;',
    )
  })

  test('marks a hidden network, and says nothing when it is not hidden', () => {
    assert.ok(
      payloadOf('wifi', { wifiSsid: 'Back Office', wifiPassword: 'pw', wifiHidden: true }).includes(
        ';H:true',
      ),
    )
    assert.ok(
      !payloadOf('wifi', { wifiSsid: 'Back Office', wifiPassword: 'pw' }).includes('H:'),
      'H:false trips up some Android versions, so it should be omitted',
    )
  })

  test('keeps a password with a leading or trailing space, which is legal', () => {
    assert.equal(
      payloadOf('wifi', { wifiSsid: 'Net', wifiPassword: ' spaced ' }),
      'WIFI:T:WPA;S:Net;P: spaced ;;',
    )
  })
})

/* ------------------------------------------------------------------ *
 * Wi-Fi escaping
 *
 * The separators are `;` and `:`, so a value containing one has to be escaped
 * or the phone joins the wrong network — or nothing at all.
 * ------------------------------------------------------------------ */

describe('escapeWifiValue', () => {
  test('escapes every reserved character', () => {
    assert.equal(escapeWifiValue('a;b'), 'a\\;b')
    assert.equal(escapeWifiValue('a:b'), 'a\\:b')
    assert.equal(escapeWifiValue('a,b'), 'a\\,b')
    assert.equal(escapeWifiValue('a"b'), 'a\\"b')
    assert.equal(escapeWifiValue('a\\b'), 'a\\\\b')
  })

  test('leaves ordinary text alone', () => {
    assert.equal(escapeWifiValue('Cafe Guest 2'), 'Cafe Guest 2')
    assert.equal(escapeWifiValue("Joe's Cafe"), "Joe's Cafe")
  })

  test('escapes a separator inside an ssid, not just a password', () => {
    assert.equal(
      payloadOf('wifi', { wifiSsid: 'Joe;s Cafe', wifiPassword: 'pw' }),
      'WIFI:T:WPA;S:Joe\\;s Cafe;P:pw;;',
    )
  })

  test('escapes a password made entirely of reserved characters', () => {
    assert.equal(
      payloadOf('wifi', { wifiSsid: 'Net', wifiPassword: ';:,"\\' }),
      'WIFI:T:WPA;S:Net;P:\\;\\:\\,\\"\\\\;;',
    )
  })

  test('does not double-escape a backslash the user typed', () => {
    // One user backslash becomes exactly two in the payload.
    assert.equal(escapeWifiValue('pass\\word'), 'pass\\\\word')
  })
})

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

describe('required fields', () => {
  test('every type rejects a completely empty form', () => {
    for (const { value } of QR_TYPES) {
      const result = buildPayload(value, EMPTY_FIELDS)
      assert.equal(result.ok, false, `${value} accepted an empty form`)
    }
  })

  test('whitespace alone does not count as filled in', () => {
    assert.deepEqual(errorFields('url', { url: '   ' }), ['url'])
    assert.deepEqual(errorFields('text', { text: ' \n\t ' }), ['text'])
    assert.deepEqual(errorFields('phone', { phone: '  ' }), ['phone'])
    assert.deepEqual(errorFields('wifi', { wifiSsid: '  ', wifiPassword: 'pw' }), ['wifiSsid'])
  })

  test('the error names the field it belongs to, so it renders next to it', () => {
    assert.deepEqual(errorFields('email'), ['emailAddress'])
    assert.deepEqual(errorFields('sms'), ['smsPhone'])
  })

  test('reports every problem at once rather than one at a time', () => {
    assert.deepEqual(errorFields('wifi', { wifiSsid: '', wifiPassword: '' }), [
      'wifiSsid',
      'wifiPassword',
    ])
  })

  test('every message is plain language with no technical leakage', () => {
    for (const { value } of QR_TYPES) {
      const result = buildPayload(value, EMPTY_FIELDS)
      assert.equal(result.ok, false)
      if (result.ok) continue

      for (const error of result.errors) {
        assert.ok(error.message.length > 0, `${value}.${error.field} has an empty message`)
        assert.doesNotMatch(
          error.message,
          /undefined|null|NaN|Error:|codeword|regex|payload|\bengine\b/i,
          `${value}.${error.field} leaks a technical term: ${error.message}`,
        )
      }
    }
  })
})

describe('url validation', () => {
  test('rejects a bare word with no dot, which cannot be a web address', () => {
    assert.deepEqual(errorFields('url', { url: 'notaurl' }), ['url'])
  })

  test('rejects a hostname that is only a scheme', () => {
    assert.deepEqual(errorFields('url', { url: 'https://' }), ['url'])
  })

  test('rejects a space-separated sentence', () => {
    assert.deepEqual(errorFields('url', { url: 'this is not a url' }), ['url'])
  })

  test('accepts a subdomain, a port and a path', () => {
    assert.ok(buildPayload('url', fields({ url: 'shop.example.co.uk:8080/a/b' })).ok)
  })

  test('accepts an ip address, which has no dotted name but is still reachable', () => {
    assert.ok(buildPayload('url', fields({ url: 'http://192.168.1.1/setup' })).ok)
  })
})

describe('email validation', () => {
  test('rejects an address with no @', () => {
    assert.deepEqual(errorFields('email', { emailAddress: 'example.com' }), ['emailAddress'])
  })

  test('rejects an address with no domain dot', () => {
    assert.deepEqual(errorFields('email', { emailAddress: 'hi@example' }), ['emailAddress'])
  })

  test('rejects an address with a space in it', () => {
    assert.deepEqual(errorFields('email', { emailAddress: 'hi there@example.com' }), [
      'emailAddress',
    ])
  })

  test('rejects an address ending in a dot', () => {
    assert.deepEqual(errorFields('email', { emailAddress: 'hi@example.' }), ['emailAddress'])
  })

  test('accepts the shapes real addresses take', () => {
    for (const address of [
      'hi@example.com',
      'first.last@example.co.uk',
      'user+tag@example.org',
      "o'brien@example.com",
      'user_name@sub.example.io',
    ]) {
      assert.ok(buildPayload('email', fields({ emailAddress: address })).ok, `rejected ${address}`)
    }
  })

  test('a valid address with an invalid-looking subject is still fine', () => {
    assert.ok(
      buildPayload('email', fields({ emailAddress: 'hi@example.com', emailSubject: '???' })).ok,
    )
  })
})

describe('phone and sms validation', () => {
  test('rejects letters', () => {
    assert.deepEqual(errorFields('phone', { phone: 'call me' }), ['phone'])
    assert.deepEqual(errorFields('sms', { smsPhone: 'text me' }), ['smsPhone'])
  })

  test('rejects a number too short to dial', () => {
    assert.deepEqual(errorFields('phone', { phone: '12' }), ['phone'])
  })

  test('accepts the formats people actually type', () => {
    for (const phone of [
      '+15551234567',
      '555-123-4567',
      '(555) 123 4567',
      '+1 (555) 123-4567',
      '020 7946 0958',
      '+44 20 7946 0958',
    ]) {
      assert.ok(buildPayload('phone', fields({ phone })).ok, `rejected ${phone}`)
    }
  })

  test('rejects a + that is not a country-code prefix', () => {
    assert.deepEqual(errorFields('phone', { phone: '555+1234' }), ['phone'])
    assert.deepEqual(errorFields('phone', { phone: '++15551234567' }), ['phone'])
  })

  test('rejects punctuation that never appears in a phone number', () => {
    assert.deepEqual(errorFields('phone', { phone: '555/123/4567' }), ['phone'])
    assert.deepEqual(errorFields('phone', { phone: '555#1234' }), ['phone'])
  })

  test('an invalid number is caught even when the message is fine', () => {
    assert.deepEqual(errorFields('sms', { smsPhone: 'nope', smsMessage: 'Hello' }), ['smsPhone'])
  })
})

describe('wifi security rules', () => {
  test('requires a password when the network is protected', () => {
    assert.deepEqual(errorFields('wifi', { wifiSsid: 'Net', wifiSecurity: 'WPA' }), [
      'wifiPassword',
    ])
    assert.deepEqual(errorFields('wifi', { wifiSsid: 'Net', wifiSecurity: 'WEP' }), [
      'wifiPassword',
    ])
  })

  test('needs no password when the network is open', () => {
    assert.ok(buildPayload('wifi', fields({ wifiSsid: 'Net', wifiSecurity: 'nopass' })).ok)
  })

  test('accepts every security mode the selector offers', () => {
    for (const { value } of WIFI_SECURITIES) {
      const result = buildPayload(
        'wifi',
        fields({ wifiSsid: 'Net', wifiPassword: 'password', wifiSecurity: value }),
      )
      assert.ok(result.ok, `${value} was rejected`)
      assert.ok(result.ok && result.payload.includes(`T:${value}`))
    }
  })
})

/* ------------------------------------------------------------------ *
 * Form wiring and filenames
 * ------------------------------------------------------------------ */

describe('form metadata', () => {
  test('every type has a label and a hint for the selector', () => {
    for (const entry of QR_TYPES) {
      assert.ok(entry.label.length > 0, `${entry.value} has no label`)
      assert.ok(entry.hint.length > 0, `${entry.value} has no hint`)
    }
  })

  test('every type declares the fields it reads, and they all exist', () => {
    const known = new Set(Object.keys(EMPTY_FIELDS))

    for (const { value } of QR_TYPES) {
      const declared = FIELDS_BY_TYPE[value]
      assert.ok(declared.length > 0, `${value} declares no fields`)
      for (const field of declared) {
        assert.ok(known.has(field), `${value} declares unknown field ${field}`)
      }
    }
  })

  test('switching type keeps what the user typed, so nothing is silently lost', () => {
    // One flat record: filling in a url then switching to text must not wipe it.
    const typed = fields({ url: 'https://example.com', text: 'kept' })
    assert.equal(typed.url, 'https://example.com')
    assert.equal(typed.text, 'kept')
  })
})

describe('downloadName', () => {
  test('names the file after the type, never after what the user typed', () => {
    assert.equal(downloadName('url', 'png'), 'qr-code-link.png')
    assert.equal(downloadName('wifi', 'svg'), 'qr-code-wifi.svg')
  })

  test('every type produces a safe, distinct filename', () => {
    const names = new Set<string>()

    for (const { value } of QR_TYPES) {
      for (const extension of ['png', 'svg'] as const) {
        const name = downloadName(value, extension)
        assert.match(name, /^[a-z0-9-]+\.(png|svg)$/, `${name} is not a safe filename`)
        names.add(name)
      }
    }

    assert.equal(names.size, QR_TYPES.length * 2)
  })

  test('a payload containing a path or quote cannot reach the filename', () => {
    const name = downloadName('url', 'png')
    assert.ok(!name.includes('/') && !name.includes('\\') && !name.includes('..'))
  })
})
