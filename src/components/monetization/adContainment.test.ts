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
const ADSENSE_ADAPTER = readFileSync(
  join(PROJECT_ROOT, 'src/components/monetization/providers/AdSenseAdapter.tsx'),
  'utf8',
)
const GLOBALS = readFileSync(join(PROJECT_ROOT, 'src/styles/globals.css'), 'utf8')

describe('active ads stay inside the reviewed placement boundary', () => {
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
      /\.ad-slot > \.ad-provider-content\s*\{[\s\S]*margin-left: 0 !important;[\s\S]*width: 100% !important;[\s\S]*max-width: 100% !important;/,
    )
    assert.match(ADSENSE_ADAPTER, /className="adsbygoogle ad-provider-content"/)
    assert.match(
      GLOBALS,
      /@media \(min-width: 48rem\)[\s\S]*--ad-height-current: var\(--ad-height-wide\);/,
    )
  })

  test('loading does not reserve layout before the provider confirms a fill', () => {
    assert.match(AD_SLOT, /useState<boolean \| null>\(null\)/)
    assert.match(AD_SLOT, /const slotIsActive = available === true/)
    assert.match(AD_SLOT, /height: 0/)
    assert.match(AD_SLOT, /minHeight: 0/)
    assert.match(AD_SLOT, /maxHeight: 0/)
    assert.match(AD_SLOT, /margin: 0/)
    assert.match(AD_SLOT, /className=\{slotIsActive \? cn\('ad-slot', className\) : undefined\}/)
  })

  test('only a confirmed filled placement receives the reserved boundary', () => {
    assert.match(ADSENSE_ADAPTER, /status === 'filled'/)
    assert.match(ADSENSE_ADAPTER, /onAvailabilityChange\(true\)/)
    assert.match(AD_SLOT, /if \(!provider \|\| available === false\) return null/)
    assert.match(AD_SLOT, /if \(!slot \|\| !provider \|\| available !== true\) return/)
  })

  test('unfilled, provider errors, and silent providers collapse without space', () => {
    assert.match(ADSENSE_ADAPTER, /status === 'unfilled'/)
    assert.match(ADSENSE_ADAPTER, /onAvailabilityChange\(false\)/)
    assert.match(ADSENSE_ADAPTER, /const AVAILABILITY_TIMEOUT_MS = 10_000/)
    assert.match(ADSENSE_ADAPTER, /window\.setTimeout/)
    assert.match(ADSENSE_ADAPTER, /window\.clearTimeout\(timeout\)/)
    assert.match(ADSENSE_ADAPTER, /catch \(error\) \{[\s\S]*onAvailabilityChange\(false\)/)
  })
})
