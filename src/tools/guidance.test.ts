import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CATEGORIES } from '@/data/categories'
import {
  TOOLS,
  getAvailableTools,
  getNavigationTree,
  getRelatedTools,
  getTool,
  getToolCategory,
} from '@/tools/registry'
import { TOOLS_PATH, categoryPath, toolPath } from '@/lib/paths'

/*
  The questions a tool page has to answer — where am I, what happened, what do I
  do next, where can I go from here — are answered by components reading the
  registry. These tests defend the two failure modes that would break that
  quietly: a tool that looks usable when it is not, and a page that offers no way
  onward. Plus one sweep for internal vocabulary leaking into user-facing copy.
*/

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url))

function readProjectFile(relativePath: string): string {
  return readFileSync(join(PROJECT_ROOT, relativePath), 'utf8')
}

/** Every component and page file, excluding tests and the registry itself. */
function uiSourceFiles(): Array<{ path: string; source: string }> {
  const found: Array<{ path: string; source: string }> = []

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
      } else if (/\.tsx$/.test(entry) && !/\.test\.tsx$/.test(entry)) {
        found.push({ path: full, source: readFileSync(full, 'utf8') })
      }
    }
  }

  walk(join(PROJECT_ROOT, 'src', 'components'))
  walk(join(PROJECT_ROOT, 'src', 'pages'))
  walk(join(PROJECT_ROOT, 'src', 'tools'))

  return found
}

describe('onward navigation exists for every tool', () => {
  test('every tool has somewhere to go next', () => {
    for (const tool of TOOLS) {
      assert.ok(
        getRelatedTools(tool.slug).length > 0,
        `${tool.slug} is a dead end — no related tools`,
      )
    }
  })

  test('the related set never includes the tool the user is already on', () => {
    for (const tool of TOOLS) {
      for (const related of getRelatedTools(tool.slug)) {
        assert.notEqual(related.slug, tool.slug, `${tool.slug} recommends itself`)
      }
    }
  })

  test('the related set stays small rather than becoming a second index', () => {
    for (const tool of TOOLS) {
      assert.ok(getRelatedTools(tool.slug).length <= 3, `${tool.slug} recommends too many tools`)
    }
  })

  test('the related set has no repeats', () => {
    for (const tool of TOOLS) {
      const slugs = getRelatedTools(tool.slug).map((entry) => entry.slug)
      assert.equal(new Set(slugs).size, slugs.length, `${tool.slug} lists a tool twice`)
    }
  })

  test('every tool page can offer its owning category as an escape hatch', () => {
    for (const tool of TOOLS) {
      const category = getToolCategory(tool.slug)
      assert.ok(category, `${tool.slug} has no category to escape to`)
      assert.equal(categoryPath(category.slug), `/categories/${category.slug}`)
    }
  })

  test('recommendations come from the registry, not a second hardcoded list', () => {
    const source = readProjectFile('src/components/tools/RelatedTools.tsx')
    assert.match(source, /getRelatedTools/)

    // A literal tool slug in the recommendation component would be the start of
    // a parallel system that drifts from the registry.
    for (const tool of TOOLS) {
      assert.ok(
        !source.includes(`'${tool.slug}'`),
        `RelatedTools hardcodes ${tool.slug} instead of deriving it`,
      )
    }
  })
})

describe('an unbuilt tool cannot present itself as usable', () => {
  test('only tools with an implementation are counted as available', () => {
    for (const tool of getAvailableTools()) {
      assert.ok(tool.component, `${tool.slug} is counted available with no component`)
    }
  })

  test('the availability count agrees with the registry, page by page', () => {
    // Pages render this number; if it were computed independently anywhere it
    // would eventually disagree with the tool grid beside it.
    const fromRegistry = TOOLS.filter((tool) => tool.status === 'available').length
    assert.equal(getAvailableTools().length, fromRegistry)

    const fromNavigation = getNavigationTree().reduce(
      (sum, entry) => sum + entry.availableCount,
      0,
    )
    assert.equal(fromNavigation, fromRegistry)
  })

  test('a planned tool still has a real route, so its card is never a broken link', () => {
    for (const tool of TOOLS) {
      if (tool.status === 'available') continue
      assert.equal(toolPath(tool.slug), `${TOOLS_PATH}/${tool.slug}`)
      assert.ok(getTool(tool.slug), `${tool.slug} has a card but no registry entry`)
    }
  })

  test('the tool page decides what to render from status, not from a separate flag', () => {
    const source = readProjectFile('src/pages/ToolPage.tsx')
    assert.match(source, /status\s*===\s*'available'|ComingSoon/)
  })
})

describe('user-facing copy stays out of the implementation vocabulary', () => {
  /*
    'planned', 'implemented', 'registered', 'not built' are how the codebase
    talks about itself. A visitor should read "Coming soon" instead. This sweeps
    rendered text only: identifiers and comments are legitimate uses.
  */
  const BANNED = ['implemented', 'registered', 'not built yet', 'unimplemented']

  /** Strips comments and JSX expression braces to leave literal rendered text. */
  function renderedText(source: string): string {
    return source
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/[^\n]*/g, ' ')
      .replace(/>\s*\{[^}]*\}\s*</g, '><')
  }

  test('no page renders internal status terminology', () => {
    for (const { path, source } of uiSourceFiles()) {
      const text = renderedText(source).toLowerCase()
      for (const word of BANNED) {
        assert.ok(!text.includes(word), `${path} shows internal terminology: "${word}"`)
      }
    }
  })

  test("the word 'planned' never reaches the screen as a status label", () => {
    for (const { path, source } of uiSourceFiles()) {
      const text = renderedText(source)
      // `status === 'planned'` is a comparison, not copy: allow the quoted form,
      // reject a bare capitalised label a user would read.
      assert.ok(!/>\s*Planned\s*</.test(text), `${path} renders "Planned" as a label`)
    }
  })
})

describe('every route a page links to resolves', () => {
  const ROUTES = new Set([
    '/',
    TOOLS_PATH,
    '/categories',
    '/privacy',
    '/terms',
    '/contact',
    ...TOOLS.map((tool) => toolPath(tool.slug)),
    ...CATEGORIES.map((category) => categoryPath(category.slug)),
  ])

  test('the route table covers every tool and category', () => {
    for (const tool of TOOLS) assert.ok(ROUTES.has(toolPath(tool.slug)))
    for (const category of CATEGORIES) assert.ok(ROUTES.has(categoryPath(category.slug)))
  })

  test('no literal tool or category URL is hand-written in a component', () => {
    // Hand-written paths are how a tool ends up with two URLs. Everything must
    // go through the helpers in lib/paths.
    for (const { path, source } of uiSourceFiles()) {
      if (path.endsWith(join('lib', 'paths.ts'))) continue
      for (const match of source.matchAll(/['"](\/tools\/[a-z0-9-]+|\/categories\/[a-z0-9-]+)['"]/g)) {
        assert.fail(`${path} hand-writes the route ${match[1]} instead of using a path helper`)
      }
    }
  })

  test('the router declares a catch-all, so an unknown address is a real 404', () => {
    const routes = readProjectFile('src/app/routes.tsx')
    assert.match(routes, /path="\*"/)
    assert.match(routes, /NotFound/)
  })

  test('every route in the router is one the registry or the static set knows', () => {
    const routes = readProjectFile('src/app/routes.tsx')
    const declared = [...routes.matchAll(/path="([^"]+)"/g)].map((match) => match[1])

    for (const path of declared) {
      if (path === '*') continue
      // Parameterised routes stand in for the registry-driven set.
      if (path.includes(':')) {
        assert.ok(
          path === '/tools/:slug' || path === '/categories/:slug',
          `unexpected parameterised route ${path}`,
        )
        continue
      }
      assert.ok(ROUTES.has(path), `router declares ${path}, which nothing links to`)
    }
  })
})
