import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test, describe } from 'node:test'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const AD_SLOT = readFileSync(
  join(PROJECT_ROOT, 'src/components/monetization/AdSlot.tsx'),
  'utf8',
)
const GLOBALS = readFileSync(join(PROJECT_ROOT, 'src/styles/globals.css'), 'utf8')

describe('AdSense stays inside the reviewed placement boundary', () => {
  test('each slot exposes its declared narrow and wide heights to CSS', () => {
    assert.match(AD_SLOT, /'--ad-height-narrow': `\$\{AD_SIZES\[placement\]\.narrow\}px`/)
    assert.match(AD_SLOT, /'--ad-height-wide': `\$\{AD_SIZES\[placement\]\.wide\}px`/)
  })

  test('provider style mutations cannot remove the slot height boundary', () => {
    assert.match(AD_SLOT, /new MutationObserver\(preserveBoundary\)/)
    assert.match(AD_SLOT, /observer\.observe\(slot, \{ attributes: true, attributeFilter: \['style'\] \}\)/)
    assert.match(
      AD_SLOT,
      /slot\.style\.setProperty\(property, 'var\(--ad-height-current\)', 'important'\)/,
    )
    assert.match(AD_SLOT, /return \(\) => observer\.disconnect\(\)/)
  })

  test('the slot clips injected full-width geometry at 100px mobile and 90px desktop', () => {
    assert.match(
      GLOBALS,
      /\.ad-slot\s*\{[\s\S]*--ad-height-current: var\(--ad-height-narrow\);[\s\S]*overflow: hidden;/,
    )
    assert.match(
      GLOBALS,
      /\.ad-slot > \.adsbygoogle\s*\{[\s\S]*margin-left: 0 !important;[\s\S]*width: 100% !important;[\s\S]*max-width: 100% !important;/,
    )
    assert.match(
      GLOBALS,
      /@media \(min-width: 48rem\)[\s\S]*--ad-height-current: var\(--ad-height-wide\);/,
    )
  })
})
