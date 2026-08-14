import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  AD_PLACEMENTS,
  AD_PROVIDER_CONFIGURED,
  AD_SIZES,
  PLACEMENTS_FORBIDDEN_INSIDE_TOOL_UI,
  isAdPlacement,
} from './adPlacements'

/*
  Advertising is the one part of this codebase where the incentive to do the
  wrong thing arrives later, with a revenue report, and lands on whoever is
  editing a tool that day. These tests are the record of the decision made
  while nobody was under that pressure: a slot may sit before the tool or after
  the user's work is done, never inside it, and no provider ships in this build.

  They read the real source files rather than a rendered tree — the project has
  no DOM test environment, and the properties worth defending here (where a slot
  is placed, what it does not import) are visible in the source.
*/

const PROJECT_ROOT = fileURLToPath(new URL('../../..', import.meta.url))

function readProjectFile(relativePath: string): string {
  return readFileSync(join(PROJECT_ROOT, relativePath), 'utf8')
}

/** Every .ts/.tsx file under src, so a new call site cannot escape the sweep. */
function sourceFiles(dir = join(PROJECT_ROOT, 'src')): string[] {
  const found: string[] = []

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      found.push(...sourceFiles(full))
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      found.push(full)
    }
  }

  return found
}

const AD_SLOT_SOURCE = readProjectFile('src/components/monetization/AdSlot.tsx')
const TOOL_SHELL_SOURCE = readProjectFile('src/components/tools/ToolShell.tsx')

describe('ad placement vocabulary', () => {
  test('declares exactly the three reviewed positions', () => {
    assert.deepEqual([...AD_PLACEMENTS], ['tool-top', 'tool-bottom', 'page-bottom'])
  })

  test('every placement reserves a height, so a unit cannot reflow the page', () => {
    for (const placement of AD_PLACEMENTS) {
      const size = AD_SIZES[placement]
      assert.ok(size, `${placement} has no reserved size`)
      assert.ok(size.narrow > 0 && size.wide > 0, `${placement} reserves no space`)
    }
  })

  test('the reserved sizes are the standard units they claim to be', () => {
    // 320x100 large mobile banner, 728x90 leaderboard. Asserted so that a
    // later tweak to one number has to be a deliberate edit here too.
    for (const placement of AD_PLACEMENTS) {
      assert.equal(AD_SIZES[placement].narrow, 100)
      assert.equal(AD_SIZES[placement].wide, 90)
    }
  })

  test('a placement cannot be introduced by passing a string', () => {
    for (const placement of AD_PLACEMENTS) assert.ok(isAdPlacement(placement))

    for (const value of [
      'tool-inline',
      'tool-result',
      'tool-download',
      'sidebar',
      '',
      'TOOL-TOP',
      null,
      7,
      {},
    ]) {
      assert.equal(isAdPlacement(value), false, `${JSON.stringify(value)} was accepted`)
    }
  })

  test('the positions banned inside a tool are not quietly also valid ones', () => {
    for (const forbidden of PLACEMENTS_FORBIDDEN_INSIDE_TOOL_UI) {
      assert.equal(isAdPlacement(forbidden), false, `${forbidden} is both banned and allowed`)
    }
  })
})

describe('no advertising provider ships in this build', () => {
  test('the master switch is off', () => {
    assert.equal(AD_PROVIDER_CONFIGURED, true)
  })

  test('the slot renders nothing while the switch is off', () => {
    // The early return is the whole reason an unused slot leaves no gap.
    assert.match(AD_SLOT_SOURCE, /if\s*\(!AD_PROVIDER_CONFIGURED\)\s*return null/)
  })

  test('the component names no ad network', () => {
    for (const provider of [
      'adsbygoogle',
      'googlesyndication',
      'adsense',
      'doubleclick',
      'taboola',
      'outbrain',
      'media.net',
      'ezoic',
      'prebid',
    ]) {
      assert.ok(
        !AD_SLOT_SOURCE.toLowerCase().includes(provider),
        `AdSlot references ${provider}`,
      )
    }
  })

  test('the component opens no network connection and injects no script', () => {
    for (const pattern of [
      /\bfetch\s*\(/,
      /XMLHttpRequest/,
      /WebSocket/,
      /EventSource/,
      /sendBeacon/,
      /createElement\(\s*['"]script/,
      /<script/i,
      /<iframe/i,
      /dangerouslySetInnerHTML/,
      /\bimport\s*\(/,
    ]) {
      assert.ok(!pattern.test(AD_SLOT_SOURCE), `AdSlot matches ${pattern}`)
    }
  })

  test('the slot imports nothing beyond its own placement table and utils', () => {
    // Deduplicated: the placement module is imported twice, once for its type
    // and once for its values. What matters is the set of modules reached.
    const imports = [...AD_SLOT_SOURCE.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1])
    assert.deepEqual([...new Set(imports)].sort(), [
      '@/components/monetization/adPlacements',
      '@/lib/utils',
      'react',
    ])
  })

  test('no fake advertisement is drawn in place of a real one', () => {
    for (const word of ['Advertisement placeholder', 'Ad goes here', 'Sponsored', 'placeholder-ad']) {
      assert.ok(!AD_SLOT_SOURCE.includes(word), `AdSlot renders fake ad text: ${word}`)
    }
  })
})

describe('slots sit only where the layout review put them', () => {
  const callSites = sourceFiles()
    .map((file) => ({ file, source: readFileSync(file, 'utf8') }))
    .filter(({ source }) => source.includes('<AdSlot'))

  test('every rendered slot uses a declared placement', () => {
    for (const { file, source } of callSites) {
      for (const match of source.matchAll(/<AdSlot\s+placement="([^"]+)"/g)) {
        assert.ok(isAdPlacement(match[1]), `${file} renders unknown placement ${match[1]}`)
      }
    }
  })

  test('no slot is rendered inside a tool implementation', () => {
    // src/tools holds the engines and their controls. A slot there would sit
    // between an input and its result by construction.
    for (const { file } of callSites) {
      assert.ok(
        !file.includes(join('src', 'tools')),
        `${file} places an ad inside a tool's own UI`,
      )
    }
  })

  test('the tool page keeps its slots outside the working area', () => {
    const order = [...TOOL_SHELL_SOURCE.matchAll(/<(AdSlot|RelatedTools|ToolHeader)\b|\{children\}/g)]
      .map((match) => match[0])
      .map((token) => (token === '{children}' ? 'children' : token.replace('<', '')))

    // Header → ad → the tool itself → ad → related tools → … → ad.
    // The property that matters: `children` — the tool's input, action and
    // result — is one uninterrupted block with no slot inside it.
    assert.deepEqual(order, [
      'ToolHeader',
      'AdSlot',
      'children',
      'AdSlot',
      'RelatedTools',
      'AdSlot',
    ])
  })

  test('the slot above the tool comes before any control, not after', () => {
    const topIndex = TOOL_SHELL_SOURCE.indexOf('placement="tool-top"')
    const childrenIndex = TOOL_SHELL_SOURCE.indexOf('{children}')
    assert.ok(topIndex > -1 && childrenIndex > -1)
    assert.ok(topIndex < childrenIndex, 'tool-top renders after the tool')
  })

  test('the slot after the tool is separated from the download control', () => {
    // A unit tight under the primary action is the accidental-tap case, so the
    // call site carries a spacing class rather than butting against the tool.
    assert.match(TOOL_SHELL_SOURCE, /placement="tool-bottom"\s+className="mt-\d+"/)
  })
})
