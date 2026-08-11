import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { CATEGORIES, getCategory } from '@/data/categories'
import { TOOLS, getNavigationTree, getTool, getToolCategory, getToolTrail } from '@/tools/registry'
import { CATEGORIES_PATH, TOOLS_PATH, categoryPath, toolPath } from '@/lib/paths'

/*
  Navigation is derived from the registry, never declared alongside it. These
  tests are written to fail if a second source of truth ever appears: they
  compare the tree against TOOLS and CATEGORIES rather than against a fixture
  listing the same names again.
*/

describe('navigation tree', () => {
  const tree = getNavigationTree()

  test('every category shown is a real category, in registry order', () => {
    const shown = tree.map((entry) => entry.category.id)
    const expected = CATEGORIES.filter((category) =>
      TOOLS.some((tool) => tool.category === category.id),
    ).map((category) => category.id)

    assert.deepEqual(shown, expected)
  })

  test('groups every tool under its own category and loses none', () => {
    for (const entry of tree) {
      for (const tool of entry.tools) {
        assert.equal(
          tool.category,
          entry.category.id,
          `${tool.slug} is listed under ${entry.category.id}`,
        )
      }
    }

    const listed = tree.flatMap((entry) => entry.tools.map((tool) => tool.slug)).sort()
    assert.deepEqual(listed, TOOLS.map((tool) => tool.slug).sort())
  })

  test('no tool appears twice, so the menu has no duplicate links', () => {
    const listed = tree.flatMap((entry) => entry.tools.map((tool) => tool.slug))
    assert.equal(new Set(listed).size, listed.length)
  })

  test('contains no tool that is absent from the registry', () => {
    for (const entry of tree) {
      for (const tool of entry.tools) {
        assert.ok(getTool(tool.slug), `${tool.slug} is not in the registry`)
      }
    }
  })

  test('omits categories that have no tools, rather than showing an empty menu', () => {
    for (const entry of tree) {
      assert.ok(entry.tools.length > 0, `${entry.category.id} is empty but still listed`)
    }
  })

  test('the ready count matches the tools actually marked available', () => {
    for (const entry of tree) {
      assert.equal(
        entry.availableCount,
        entry.tools.filter((tool) => tool.status === 'available').length,
      )
    }

    const total = tree.reduce((sum, entry) => sum + entry.availableCount, 0)
    assert.equal(total, TOOLS.filter((tool) => tool.status === 'available').length)
  })

  test('built tools are listed before planned ones within a category', () => {
    for (const entry of tree) {
      const lastAvailable = entry.tools.findLastIndex((tool) => tool.status === 'available')
      const firstPlanned = entry.tools.findIndex((tool) => tool.status === 'planned')
      if (lastAvailable === -1 || firstPlanned === -1) continue
      assert.ok(lastAvailable < firstPlanned, `${entry.category.id} interleaves planned tools`)
    }
  })

  test('every link the menu renders is a real route', () => {
    for (const entry of tree) {
      assert.equal(categoryPath(entry.category.slug), `${CATEGORIES_PATH}/${entry.category.slug}`)
      assert.ok(getCategory(entry.category.slug), `${entry.category.slug} has no category page`)

      for (const tool of entry.tools) {
        assert.equal(toolPath(tool.slug), `${TOOLS_PATH}/${tool.slug}`)
      }
    }
  })

  test('the tree is rebuilt per call, so a caller cannot mutate the registry', () => {
    const first = getNavigationTree()
    first.length = 0
    first.push({ category: CATEGORIES[0]!, tools: [], availableCount: 99 })

    assert.deepEqual(
      getNavigationTree().map((entry) => entry.category.id),
      tree.map((entry) => entry.category.id),
    )
  })
})

describe('tool category lookup', () => {
  test('resolves the owning category for every tool', () => {
    for (const tool of TOOLS) {
      const category = getToolCategory(tool.slug)
      assert.ok(category, `${tool.slug} has no category`)
      assert.equal(category.id, tool.category)
    }
  })

  test('an unknown slug resolves to nothing rather than a wrong category', () => {
    for (const slug of ['', 'not-a-tool', 'image-compressor-x', '../tools', 'IMAGE-COMPRESSOR']) {
      assert.equal(getToolCategory(slug), undefined, `${slug} resolved to a category`)
    }
  })
})

describe('tool page breadcrumb', () => {
  test('reads All Tools / Category / Tool for every tool', () => {
    for (const tool of TOOLS) {
      const trail = getToolTrail(tool.slug)
      const category = getToolCategory(tool.slug)!

      assert.deepEqual(
        trail.map((crumb) => crumb.label),
        ['All Tools', category.name, tool.name],
      )
    }
  })

  test('the first crumb is the marked route back into the warehouse', () => {
    const [first] = getToolTrail('image-compressor')
    assert.equal(first?.to, TOOLS_PATH)
    assert.equal(first?.back, true)
  })

  test('the category crumb links to that category page', () => {
    const trail = getToolTrail('pdf-compressor')
    assert.equal(trail[1]?.to, categoryPath('pdfs'))
  })

  test('the final crumb is the current page and carries no link', () => {
    for (const tool of TOOLS) {
      const trail = getToolTrail(tool.slug)
      assert.equal(trail.at(-1)?.to, undefined, `${tool.slug} links its own crumb`)
    }
  })

  test('every linked crumb resolves to a page that exists', () => {
    for (const tool of TOOLS) {
      for (const crumb of getToolTrail(tool.slug)) {
        if (!crumb.to) continue
        if (crumb.to === TOOLS_PATH) continue

        const slug = crumb.to.replace(`${CATEGORIES_PATH}/`, '')
        assert.ok(getCategory(slug), `${crumb.to} is not a real category page`)
      }
    }
  })

  test('an unknown slug yields no trail, so a 404 renders nothing misleading', () => {
    assert.deepEqual(getToolTrail('not-a-tool'), [])
    assert.deepEqual(getToolTrail(''), [])
  })
})

describe('route construction', () => {
  test('all tool URLs come from one helper, so a tool cannot gain two URLs', () => {
    const urls = TOOLS.map((tool) => toolPath(tool.slug))
    assert.equal(new Set(urls).size, urls.length)
    for (const url of urls) assert.match(url, /^\/tools\/[a-z0-9-]+$/)
  })

  test('all category URLs are unique and well formed', () => {
    const urls = CATEGORIES.map((category) => categoryPath(category.slug))
    assert.equal(new Set(urls).size, urls.length)
    for (const url of urls) assert.match(url, /^\/categories\/[a-z0-9-]+$/)
  })

  test('index paths are the ones the navigation points at', () => {
    assert.equal(TOOLS_PATH, '/tools')
    assert.equal(CATEGORIES_PATH, '/categories')
  })
})
