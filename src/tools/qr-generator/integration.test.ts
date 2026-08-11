import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { getCategory } from '@/data/categories'
import { toolPath, categoryPath } from '@/lib/paths'
import {
  getRelatedTools,
  getTool,
  getToolCategory,
  getToolTrail,
  getToolsByCategory,
  searchTools,
} from '@/tools/registry'
import { EMPTY_FIELDS, QR_TYPES, buildPayload } from '@/tools/qr-generator/payloads'
import { encodeQr } from '@/tools/qr-generator/qrEncoder'
import { DEFAULT_APPEARANCE, toSvg } from '@/tools/qr-generator/render'
import { decodeMatrix } from '@/tools/qr-generator/testDecoder'

const SLUG = 'qr-code-generator'
const TOOL_DIR = 'src/tools/qr-generator'

/* ------------------------------------------------------------------ *
 * Registry wiring
 *
 * Everything the site shows — nav, category pages, search, related tools — is
 * derived from the registry, so these checks confirm the tool actually surfaces
 * rather than just existing.
 * ------------------------------------------------------------------ */

describe('registry wiring', () => {
  const tool = getTool(SLUG)

  test('the tool is registered and marked usable', () => {
    assert.ok(tool, 'the tool is not in the registry')
    assert.equal(tool.status, 'available')
    assert.equal(tool.clientOnly, true)
  })

  test('it ships a lazily-loaded implementation', () => {
    const component = tool?.component as { $$typeof?: symbol } | undefined
    assert.equal(component?.$$typeof, Symbol.for('react.lazy'))
  })

  test('its route resolves through the path helper', () => {
    assert.equal(toolPath(SLUG), '/tools/qr-code-generator')
  })

  test('it resolves to a category that exists and lists it', () => {
    const category = getToolCategory(SLUG)
    assert.equal(category?.id, 'generators')
    assert.ok(getCategory('generators'))
    assert.ok(getToolsByCategory('generators').some((entry) => entry.slug === SLUG))
  })

  test('its breadcrumb trail leads back through the category', () => {
    const trail = getToolTrail(SLUG)
    assert.ok(trail.length >= 2, 'a tool needs a trail to get back out of')
    assert.ok(trail.some((crumb) => crumb.to === categoryPath('generators')))
    assert.equal(trail.at(-1)?.label, 'QR Code Generator')
  })

  test('it is reachable by the words people search for', () => {
    for (const query of ['qr', 'QR code', 'wifi', 'barcode', 'scan']) {
      assert.ok(
        searchTools(query).some((entry) => entry.slug === SLUG),
        `searching "${query}" did not surface it`,
      )
    }
  })

  test('it appears as a related tool elsewhere, and gets related tools itself', () => {
    assert.ok(getRelatedTools(SLUG).length > 0)
    const appearsElsewhere = ['image-compressor', 'pdf-compressor'].some((slug) =>
      getRelatedTools(slug, 3).some((entry) => entry.slug === SLUG),
    )
    assert.ok(appearsElsewhere, 'the tool is not offered from any other tool page')
  })

  test('its copy avoids internal engineering vocabulary', () => {
    const copy = [tool?.name, tool?.description, tool?.seo.title, tool?.seo.description].join(' ')
    assert.doesNotMatch(
      copy,
      /\b(implemented|registered|planned|engine|MVP|scaffold|unavailable|coming soon)\b/i,
      `user-facing copy leaks internal vocabulary: ${copy}`,
    )
  })
})

/* ------------------------------------------------------------------ *
 * Privacy
 *
 * The repo-wide audit already forbids network and storage APIs everywhere.
 * These checks are scoped to this tool so a regression here fails with an
 * obvious cause rather than as a generic audit error.
 * ------------------------------------------------------------------ */

describe('privacy', () => {
  const sources = readdirSync(TOOL_DIR)
    .filter((name) => /\.(ts|tsx)$/.test(name))
    .map((name) => ({ name, code: readFileSync(join(TOOL_DIR, name), 'utf8') }))

  test('there are source files to check', () => {
    assert.ok(sources.length >= 6, `only found ${sources.length} files in ${TOOL_DIR}`)
  })

  test('nothing reaches the network', () => {
    for (const { name, code } of sources) {
      if (name.endsWith('.test.ts')) continue

      for (const api of [
        'fetch(',
        'XMLHttpRequest',
        'WebSocket',
        'EventSource',
        'sendBeacon',
        'navigator.connection',
        'import(\'http',
      ]) {
        assert.ok(!code.includes(api), `${name} references ${api}`)
      }
    }
  })

  test('nothing is persisted', () => {
    for (const { name, code } of sources) {
      if (name.endsWith('.test.ts')) continue

      for (const api of ['localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'caches']) {
        assert.ok(!code.includes(api), `${name} references ${api}`)
      }
    }
  })

  test('no dynamic code execution, and no raw html injection', () => {
    for (const { name, code } of sources) {
      if (name.endsWith('.test.ts')) continue

      for (const api of ['eval(', 'new Function(', '.innerHTML', 'dangerouslySetInnerHTML']) {
        assert.ok(!code.includes(api), `${name} references ${api}`)
      }
    }
  })

  test('the tool pulls in no third-party package', () => {
    // Only react, lucide icons and internal @/ modules. A QR library appearing
    // here would mean the vendored encoder had been bypassed.
    for (const { name, code } of sources) {
      if (name.endsWith('.test.ts')) continue

      for (const [, specifier] of code.matchAll(/from '([^']+)'/g)) {
        const allowed =
          specifier.startsWith('@/') ||
          specifier.startsWith('node:') ||
          specifier === 'react' ||
          specifier === 'lucide-react'

        assert.ok(allowed, `${name} imports ${specifier}`)
      }
    }
  })

  test('the filename never carries what the user typed', () => {
    const sensitive = 'secret-wifi-password'
    const result = buildPayload('wifi', {
      ...EMPTY_FIELDS,
      wifiSsid: sensitive,
      wifiPassword: sensitive,
    })

    assert.ok(result.ok)
    // downloadName takes only the type, so there is no path from field to file.
    for (const { value } of QR_TYPES) {
      const svg = toSvg(encodeQr('x'), DEFAULT_APPEARANCE)
      assert.ok(!svg.includes(sensitive), `${value} leaked the value into the svg`)
    }
  })
})

/* ------------------------------------------------------------------ *
 * End to end
 * ------------------------------------------------------------------ */

describe('every type produces a scannable code', () => {
  const CASES: ReadonlyArray<[string, Parameters<typeof buildPayload>[0], Partial<typeof EMPTY_FIELDS>]> = [
    ['url', 'url', { url: 'simpletools.example/menu' }],
    ['text', 'text', { text: 'Table 12 — back patio' }],
    ['email', 'email', { emailAddress: 'hello@example.com', emailSubject: 'Order #1234' }],
    ['phone', 'phone', { phone: '+1 (555) 123-4567' }],
    ['sms', 'sms', { smsPhone: '+15551234567', smsMessage: 'Running late' }],
    ['wifi', 'wifi', { wifiSsid: 'Joe;s Cafe', wifiPassword: 'p:ss,word' }],
  ]

  for (const [name, type, overrides] of CASES) {
    test(`${name} survives the whole pipeline`, () => {
      const result = buildPayload(type, { ...EMPTY_FIELDS, ...overrides })
      assert.ok(result.ok, `${name} failed validation`)

      const matrix = encodeQr(result.payload, {
        errorCorrection: DEFAULT_APPEARANCE.errorCorrection,
      })

      // What a scanner reads back is exactly what the payload builder produced,
      // escaping and all.
      assert.equal(decodeMatrix(matrix), result.payload)
      assert.ok(toSvg(matrix, DEFAULT_APPEARANCE).length > 0)
    })
  }

  test('all six types are covered', () => {
    assert.equal(CASES.length, QR_TYPES.length)
  })
})
