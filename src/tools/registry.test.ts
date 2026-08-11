import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { CATEGORIES, getCategory } from '@/data/categories'
import {
  TOOLS,
  getFeaturedTools,
  getRelatedTools,
  getTool,
  getToolsByCategory,
  searchTools,
} from '@/tools/registry'

describe('registry integrity', () => {
  test('registers the five MVP tools', () => {
    assert.equal(TOOLS.length, 5)
    assert.deepEqual(
      TOOLS.map((tool) => tool.slug).sort(),
      [
        'image-compressor',
        'invoice-generator',
        'pdf-compressor',
        'profit-margin-calculator',
        'qr-code-generator',
      ],
    )
  })

  test('slugs are unique', () => {
    assert.equal(new Set(TOOLS.map((tool) => tool.slug)).size, TOOLS.length)
  })

  test('slugs are URL-safe, so every tool gets a clean route', () => {
    for (const tool of TOOLS) {
      assert.match(tool.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${tool.slug} is not kebab-case`)
    }
  })

  test('every tool points at a category that exists', () => {
    const ids = new Set(CATEGORIES.map((category) => category.id))
    for (const tool of TOOLS) {
      assert.ok(ids.has(tool.category), `${tool.slug} has unknown category ${tool.category}`)
    }
  })

  test('every category has a resolvable slug', () => {
    for (const category of CATEGORIES) {
      assert.equal(getCategory(category.slug)?.id, category.id)
    }
  })

  test('every tool carries the metadata the pages render', () => {
    for (const tool of TOOLS) {
      assert.ok(tool.name.length > 0, `${tool.slug} has no name`)
      assert.ok(tool.description.length > 0, `${tool.slug} has no description`)
      assert.ok(tool.icon, `${tool.slug} has no icon`)
      assert.ok(tool.keywords.length > 0, `${tool.slug} has no keywords`)
    }
  })
})

describe('registry SEO metadata', () => {
  test('every tool has a unique title and description', () => {
    assert.equal(new Set(TOOLS.map((tool) => tool.seo.title)).size, TOOLS.length)
    assert.equal(new Set(TOOLS.map((tool) => tool.seo.description)).size, TOOLS.length)
  })

  // The brand belongs at the end of every title, but the separator is a copy
  // decision, not an architectural one: most titles read "Thing — detail |
  // SimpleTools", while a short title like the Invoice Generator's needs only
  // one separator. What matters is that no tool ships an unbranded title.
  test('every title is brand-suffixed and a sensible length', () => {
    for (const tool of TOOLS) {
      assert.match(
        tool.seo.title,
        /[|—]\s*SimpleTools$/,
        `${tool.slug} title lacks the brand suffix`,
      )
      assert.ok(tool.seo.title.length <= 70, `${tool.slug} title is ${tool.seo.title.length} chars`)
    }
  })

  test('every description fits a search result', () => {
    for (const tool of TOOLS) {
      const length = tool.seo.description.length
      assert.ok(length >= 70, `${tool.slug} description is only ${length} chars`)
      assert.ok(length <= 160, `${tool.slug} description is ${length} chars`)
    }
  })

  test('the Image Compressor title is exactly as specified', () => {
    assert.equal(
      getTool('image-compressor')?.seo.title,
      'Image Compressor — Compress Images Online | SimpleTools',
    )
  })

  test('the PDF Compressor title is exactly as specified', () => {
    assert.equal(
      getTool('pdf-compressor')?.seo.title,
      'PDF Compressor — Compress PDF Files Online | SimpleTools',
    )
  })

  test('the Invoice Generator title is exactly as specified', () => {
    assert.equal(getTool('invoice-generator')?.seo.title, 'Free Invoice Generator — SimpleTools')
  })
})

describe('tool availability', () => {
  // Updated as each tool lands. Kept as an exact list rather than a loose
  // count so that marking a tool 'available' before it is actually built
  // fails here instead of shipping a dead route.
  test('the built tools are exactly those implemented so far', () => {
    const available = TOOLS.filter((tool) => tool.status === 'available')
    assert.deepEqual(
      available.map((tool) => tool.slug),
      ['image-compressor', 'pdf-compressor', 'qr-code-generator', 'invoice-generator'],
    )
  })

  test('an available tool has an implementation and a planned one does not', () => {
    for (const tool of TOOLS) {
      if (tool.status === 'available') {
        assert.ok(tool.component, `${tool.slug} is available but has no component`)
      } else {
        assert.equal(tool.component, undefined, `${tool.slug} is planned but ships a component`)
      }
    }
  })

  test('the implementation is lazy, so it stays out of the homepage bundle', () => {
    const component = getTool('image-compressor')?.component as { $$typeof?: symbol } | undefined
    assert.equal(component?.$$typeof, Symbol.for('react.lazy'))
  })

  test('every tool processes in the browser', () => {
    for (const tool of TOOLS) {
      assert.equal(tool.clientOnly, true, `${tool.slug} is not client-only`)
    }
  })
})

describe('lookup helpers', () => {
  test('getTool finds a real slug and rejects an unknown one', () => {
    assert.equal(getTool('image-compressor')?.name, 'Image Compressor')
    assert.equal(getTool('does-not-exist'), undefined)
    assert.equal(getTool(''), undefined)
  })

  test('getToolsByCategory filters', () => {
    assert.deepEqual(
      getToolsByCategory('images').map((tool) => tool.slug),
      ['image-compressor'],
    )
    assert.equal(getToolsByCategory('generators').length, 1)
  })

  test('no category page is empty', () => {
    for (const category of CATEGORIES) {
      assert.ok(getToolsByCategory(category.id).length > 0, `${category.id} has no tools`)
    }
  })

  test('the homepage features all five', () => {
    assert.equal(getFeaturedTools().length, 5)
  })
})

describe('getRelatedTools', () => {
  test('never returns the current tool', () => {
    for (const tool of TOOLS) {
      const related = getRelatedTools(tool.slug)
      assert.ok(!related.some((entry) => entry.slug === tool.slug))
    }
  })

  test('respects the limit and returns something for every tool', () => {
    for (const tool of TOOLS) {
      const related = getRelatedTools(tool.slug, 3)
      assert.ok(related.length > 0, `${tool.slug} has no related tools`)
      assert.ok(related.length <= 3)
    }
  })

  test('leads with a tool that actually works', () => {
    assert.equal(getRelatedTools('pdf-compressor')[0]?.slug, 'image-compressor')
  })

  test('returns nothing for an unknown slug rather than throwing', () => {
    assert.deepEqual(getRelatedTools('nope'), [])
  })
})

describe('searchTools', () => {
  test('an empty query returns nothing, so the page shows its normal state', () => {
    assert.deepEqual(searchTools(''), [])
    assert.deepEqual(searchTools('    '), [])
  })

  test('finds a tool by name prefix', () => {
    assert.equal(searchTools('image')[0]?.slug, 'image-compressor')
  })

  test('is case- and whitespace-insensitive', () => {
    assert.equal(searchTools('  IMAGE  ')[0]?.slug, 'image-compressor')
  })

  test('finds a tool by a keyword the name does not contain', () => {
    assert.ok(searchTools('jpg').some((tool) => tool.slug === 'image-compressor'))
    assert.ok(searchTools('markup').some((tool) => tool.slug === 'profit-margin-calculator'))
  })

  test('ranks a name match above a keyword-only match', () => {
    const results = searchTools('invoice')
    assert.equal(results[0]?.slug, 'invoice-generator')
  })

  test('matches every tool by its own name', () => {
    for (const tool of TOOLS) {
      const results = searchTools(tool.name)
      assert.equal(results[0]?.slug, tool.slug, `searching "${tool.name}" did not surface it first`)
    }
  })

  test('returns nothing for a query that matches nothing', () => {
    assert.deepEqual(searchTools('zzzzzz'), [])
  })
})
