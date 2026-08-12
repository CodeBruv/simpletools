import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { getCategory } from '@/data/categories'
import { categoryPath, toolPath } from '@/lib/paths'
import {
  getRelatedTools,
  getTool,
  getToolCategory,
  getToolTrail,
  getToolsByCategory,
  searchTools,
} from '@/tools/registry'

const SLUG = 'profit-margin-calculator'
const TOOL_DIR = 'src/tools/profit-margin'

/**
 * How the calculator reaches a visitor.
 *
 * The arithmetic, the input reading and the wording are tested next door. This
 * file checks the wiring: that the tool is in the registry, that the registry
 * gives it a route, a category, a breadcrumb and search terms, that its page
 * metadata comes from the same place as every other tool's, and that none of its
 * code can reach the network, persist anything, or land in the homepage bundle.
 */

const sources = readdirSync(TOOL_DIR)
  .filter((name) => /\.(ts|tsx)$/.test(name) && !name.endsWith('.test.ts'))
  .map((name) => ({ name, code: readFileSync(join(TOOL_DIR, name), 'utf8') }))

describe('registry wiring', () => {
  const tool = getTool(SLUG)

  test('the tool is registered and marked usable', () => {
    assert.ok(tool, 'the tool is not in the registry')
    assert.equal(tool.status, 'available')
    assert.equal(tool.clientOnly, true)
    assert.ok(tool.icon, 'a card with no icon renders a hole')
  })

  test('it ships a lazily-loaded implementation', () => {
    const component = tool?.component as { $$typeof?: symbol } | undefined
    assert.equal(component?.$$typeof, Symbol.for('react.lazy'))
  })

  test('its route is the clean, shareable one', () => {
    assert.equal(toolPath(SLUG), '/tools/profit-margin-calculator')
  })

  test('the slug in that route resolves back to this tool', () => {
    // This is exactly what the /tools/:slug route does with the parameter it
    // captures, so a slug the registry cannot resolve would be a dead page.
    const slugFromRoute = toolPath(SLUG).replace('/tools/', '')
    assert.equal(getTool(slugFromRoute)?.name, 'Profit Margin Calculator')
  })

  test('it belongs to a category that exists and lists it', () => {
    assert.equal(getToolCategory(SLUG)?.id, 'finance')
    assert.ok(getCategory('finance'), 'the finance category is missing')
    assert.ok(getToolsByCategory('finance').some((entry) => entry.slug === SLUG))
  })

  test('its breadcrumb trail leads back out through the category', () => {
    const trail = getToolTrail(SLUG)

    assert.ok(trail.length >= 2, 'a tool needs a trail to get back out of')
    assert.ok(trail.some((crumb) => crumb.to === categoryPath('finance')))
    assert.equal(trail.at(-1)?.label, 'Profit Margin Calculator')
  })

  test('it is reachable by the words people type', () => {
    for (const query of ['profit', 'margin', 'markup', 'profit margin', 'Profit Margin Calculator']) {
      assert.ok(
        searchTools(query).some((entry) => entry.slug === SLUG),
        `searching "${query}" did not surface it`,
      )
    }
  })

  test('its own page offers somewhere to go next', () => {
    // Only this direction is asserted. Whether *other* tools happen to list this
    // one depends on how many tools exist and how the shared related-tool
    // ordering fills a set, which is not this tool's behaviour to pin down.
    const related = getRelatedTools(SLUG, 3)

    assert.ok(related.length > 0, 'the page is a dead end')
    assert.ok(!related.some((entry) => entry.slug === SLUG), 'it recommends itself')
  })
})

describe('page metadata comes from the registry', () => {
  const tool = getTool(SLUG)

  test('the entry carries everything the page-meta hook needs', () => {
    // ToolPage builds exactly this object from the registry entry, so an entry
    // that cannot fill it would ship a page with no title or canonical URL.
    const meta = {
      title: tool?.seo.title,
      description: tool?.seo.description,
      path: toolPath(SLUG),
    }

    assert.equal(meta.title, 'Profit Margin Calculator — Margin & Markup | SimpleTools')
    assert.ok((meta.description?.length ?? 0) >= 70)
    assert.equal(meta.path, '/tools/profit-margin-calculator')
  })

  test('the tool does not set metadata of its own', () => {
    // One SEO mechanism, driven by the registry. A tool reaching for document
    // .title or its own meta tags would be a second, competing system.
    for (const { name, code } of sources) {
      assert.ok(!code.includes('document.title'), `${name} sets the document title`)
      assert.ok(!code.includes('usePageMeta'), `${name} sets its own page metadata`)
      assert.ok(!code.includes('<meta'), `${name} writes its own meta tag`)
    }
  })

  test('the metadata still reads as English, not as a keyword list', () => {
    const copy = `${tool?.name} ${tool?.description} ${tool?.seo.title} ${tool?.seo.description}`

    // Every term someone might search for is present somewhere in the copy,
    // each in an actual sentence.
    for (const phrase of [
      'profit margin calculator',
      'profit calculator',
      'markup calculator',
      'calculate profit margin',
      'selling price calculator',
    ]) {
      for (const word of phrase.split(' ')) {
        const stem = word === 'calculate' || word === 'calculator' ? 'calculat' : word
        assert.match(copy.toLowerCase(), new RegExp(stem), `"${phrase}" is not covered: ${word}`)
      }
    }

    // The search-result description is the piece most tempting to stuff, so no
    // keyword may appear in it more than twice, and it has to be sentences.
    const description = tool?.seo.description.toLowerCase() ?? ''

    for (const word of ['profit', 'margin', 'markup', 'price', 'cost', 'calculat']) {
      const uses = description.split(word).length - 1
      assert.ok(uses <= 2, `"${word}" appears ${uses} times in the description, which reads as stuffing`)
    }
    assert.match(tool?.seo.description ?? '', /\.\s|\.$/, 'the description is not written as sentences')
  })

  test('the copy avoids internal engineering vocabulary', () => {
    const copy = [tool?.name, tool?.description, tool?.seo.title, tool?.seo.description].join(' ')

    assert.doesNotMatch(
      copy,
      /\b(implemented|registered|planned|engine|MVP|scaffold|unavailable|coming soon)\b/i,
      `user-facing copy leaks internal vocabulary: ${copy}`,
    )
  })
})

describe('privacy', () => {
  test('there are source files to check', () => {
    assert.deepEqual(
      sources.map((entry) => entry.name).sort(),
      [
        'MarginField.tsx',
        'MarginResults.tsx',
        'ProfitMargin.tsx',
        'calculateMargin.ts',
        'marginInputs.ts',
        'marginSummary.ts',
        'types.ts',
      ],
      'the file list changed — check the new module against the rules below',
    )
  })

  test('nothing reaches the network', () => {
    for (const { name, code } of sources) {
      for (const api of [
        'fetch(',
        'XMLHttpRequest',
        'WebSocket',
        'EventSource',
        'sendBeacon',
        'navigator.connection',
        "import('http",
      ]) {
        assert.ok(!code.includes(api), `${name} references ${api}`)
      }
    }
  })

  test('nothing is persisted', () => {
    // There is nothing to save here anyway: the figures a user types are their
    // costs and prices, and they stay in React state until the tab closes.
    for (const { name, code } of sources) {
      for (const api of [
        'localStorage',
        'sessionStorage',
        'indexedDB',
        'document.cookie',
        'caches',
      ]) {
        assert.ok(!code.includes(api), `${name} references ${api}`)
      }
    }
  })

  test('no dynamic code execution, and no raw html injection', () => {
    for (const { name, code } of sources) {
      for (const api of ['eval(', 'new Function(', '.innerHTML', 'dangerouslySetInnerHTML']) {
        assert.ok(!code.includes(api), `${name} references ${api}`)
      }
    }
  })

  test('the tool pulls in no third-party package', () => {
    // React, the icon set and internal @/ modules only. A currency or maths
    // package appearing here would mean something was added rather than reused.
    for (const { name, code } of sources) {
      for (const [, specifier] of code.matchAll(/from '([^']+)'/g)) {
        const allowed =
          specifier.startsWith('@/') ||
          specifier.startsWith('./') ||
          specifier === 'react' ||
          specifier === 'lucide-react'

        assert.ok(allowed, `${name} imports ${specifier}`)
      }
    }
  })

  test('it reuses the shared currency catalogue rather than carrying its own', () => {
    const all = sources.map((entry) => entry.code).join('\n')

    assert.match(all, /@\/tools\/invoice-generator\/currencies/)
    assert.ok(
      !sources.some((entry) => /code:\s*'[A-Z]{3}'/.test(entry.code)),
      'a second currency list has appeared in this directory',
    )
  })
})

describe('it stays out of the homepage bundle', () => {
  const guard = readFileSync('scripts/audit-bundle.mjs', 'utf8')

  test('the registry loads it through a dynamic import', () => {
    const registry = readFileSync('src/tools/registry.ts', 'utf8')
    assert.match(registry, /lazy\(\(\) => import\('@\/tools\/profit-margin\/ProfitMargin'\)\)/)
  })

  test('every module in the directory is covered by the eager-bundle guard', () => {
    // types.ts is excluded on purpose: it declares types only, so the build
    // erases it and it can never appear in a bundle.
    for (const { name } of sources) {
      if (name === 'types.ts') continue
      assert.ok(
        guard.includes(`${TOOL_DIR}/${name}`),
        `${name} is not listed in the audit-bundle guard, so it could leak into the homepage`,
      )
    }
  })
})
