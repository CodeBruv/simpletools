import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/*
  The print contract.

  Export here is the browser's own print dialogue, so "the file the customer
  receives" is produced by a stylesheet rather than by code. That makes the
  failure mode unusually quiet: delete one class and the invoice still looks
  perfect on screen while every printed copy carries the site navigation, or
  arrives with the totals sliced across two sheets, and nothing fails until a
  user has already emailed it.

  These tests read the real source, because the property being defended lives in
  CSS and in which elements carry which attribute — there is no DOM environment
  in this project, and a rendered tree would not tell us more.
*/

const PROJECT_ROOT = fileURLToPath(new URL('../../..', import.meta.url))

function readProjectFile(relativePath: string): string {
  return readFileSync(join(PROJECT_ROOT, relativePath), 'utf8')
}

const CSS = readProjectFile('src/styles/globals.css')
const PREVIEW = readProjectFile('src/tools/invoice-generator/InvoicePreview.tsx')
const EDITOR = readProjectFile('src/tools/invoice-generator/InvoiceGenerator.tsx')
const SHELL = readProjectFile('src/components/tools/ToolShell.tsx')
const LAYOUT_HEADER = readProjectFile('src/components/layout/Header.tsx')
const LAYOUT_FOOTER = readProjectFile('src/components/layout/Footer.tsx')

/**
 * The braced block beginning at `start`, brace-matched.
 *
 * Slicing to the end of the file instead would let an unrelated later rule
 * satisfy — or break — a test about this one.
 */
function blockAt(css: string, start: number, what: string): string {
  let depth = 0

  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    else if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(start, i + 1)
    }
  }

  throw new Error(`unterminated ${what} block`)
}

/** The print block only, so a rule elsewhere in the file cannot satisfy a test. */
const PRINT_BLOCK = (() => {
  const start = CSS.indexOf('@media print')
  assert.ok(start > -1, 'globals.css has no @media print block')
  return blockAt(CSS, start, '@media print')
})()

/**
 * Splits on `separators`, ignoring anything inside parentheses.
 *
 * `header:not(.print-document, .print-document *)` is one selector containing
 * one comma and one descendant combinator, and a naive split would read it as
 * two selectors or three compounds and quietly invert the tests below.
 */
function splitTopLevel(text: string, separators: RegExp): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''

  for (const char of text) {
    if (char === '(') depth += 1
    else if (char === ')') depth -= 1

    if (depth === 0 && separators.test(char)) {
      if (current.trim() !== '') parts.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  if (current.trim() !== '') parts.push(current.trim())

  return parts
}

/**
 * A selector with the contents of every parenthesised argument removed, so its
 * combinator structure can be read. `body:has(.print-document) header:not(.a *)`
 * becomes `body:has() header:not()`.
 */
function skeleton(selector: string): string {
  let out = ''
  let depth = 0

  for (const char of selector) {
    if (char === '(') {
      depth += 1
      if (depth === 1) out += '('
      continue
    }

    if (char === ')') {
      depth -= 1
      if (depth === 0) out += ')'
      continue
    }

    if (depth === 0) out += char
  }

  return out
}

/**
 * The rules inside the print block, as selectors plus declarations.
 *
 * Comments are stripped first: the block explains itself at length and names the
 * selectors it is talking about, and prose that mentions a selector must not
 * parse as one.
 */
const PRINT_RULES = (() => {
  const body = PRINT_BLOCK.replace(/\/\*[\s\S]*?\*\//g, '')
  const parsed: { selectors: string[]; declarations: string }[] = []
  const pattern = /([^{}]+)\{([^{}]*)\}/g

  for (let match = pattern.exec(body); match !== null; match = pattern.exec(body)) {
    parsed.push({
      selectors: splitTopLevel(match[1] ?? '', /,/),
      declarations: match[2] ?? '',
    })
  }

  return parsed
})()

/** Every selector in the print block that hides whatever it matches. */
const HIDING_SELECTORS = PRINT_RULES.filter((rule) =>
  /display:\s*none/.test(rule.declarations),
).flatMap((rule) => rule.selectors)

/** The element types the invoice document is built from. */
const DOCUMENT_TAGS = new Set(
  (PREVIEW.match(/<[a-z][a-z0-9]*[\s/>]/g) ?? []).map((tag) => tag.slice(1, -1)),
)

/** The letterhead markup, by element rather than by line number. */
const LETTERHEAD = PREVIEW.slice(
  PREVIEW.indexOf('<header className'),
  PREVIEW.indexOf('</header>'),
)

/** The terms-and-notes block. */
const DOCUMENT_FOOT = PREVIEW.slice(
  PREVIEW.indexOf('<footer className'),
  PREVIEW.indexOf('</footer>'),
)

function sourceFiles(dir = join(PROJECT_ROOT, 'src')): string[] {
  const found: string[] = []

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) found.push(...sourceFiles(full))
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) found.push(full)
  }

  return found
}

describe('there is exactly one printable document', () => {
  // Two elements carrying the class would print the invoice twice, which is the
  // specific defect this guards.
  const renderers = sourceFiles()
    .map((file) => ({ file, source: readFileSync(file, 'utf8') }))
    .filter(({ source }) => /className=(?:"|\{')[^"']*\bprint-document\b/.test(source))

  test('one component renders the printable region', () => {
    assert.equal(
      renderers.length,
      1,
      `expected 1 print-document renderer, found: ${renderers.map((r) => r.file).join(', ')}`,
    )
  })

  test('it is the invoice document', () => {
    assert.match(renderers[0]?.file ?? '', /InvoicePreview\.tsx$/)
  })

  test('the class appears once in it, on the outermost element', () => {
    const occurrences = PREVIEW.match(/\bprint-document\b/g) ?? []
    assert.equal(occurrences.length, 1)
    assert.match(PREVIEW, /<article\s+className="print-document/)
  })
})

describe('no print rule can reach inside the document', () => {
  /*
    This is the defect that shipped, and the reason this file is written the way
    it now is.

    The print block hid the site chrome by element type — `header, footer, nav`
    as plain descendant selectors — and the invoice document is built from
    semantic elements. Its letterhead is a `header`, holding the business name,
    the word INVOICE, the invoice number and both dates; its terms and notes are
    a `footer`. Every one of those disappeared from every saved PDF, while the
    screen stayed perfect and nothing threw, because the middle of the document
    — Bill to, the item table, the totals — is made of `section`, `table` and
    `div` and was never at risk. What printed looked like an extract of the
    invoice rather than the invoice.

    The test that used to sit here asserted those exact selectors were *present*.
    It therefore held the defect in place: it proved someone had written the
    rule, which is not the same as the rule being right. So the assertion now
    runs the other way — nothing that hides an element may be capable of
    matching an element the document renders.
  */
  test('the print block was parsed, and it still hides things', () => {
    // A guard on the test itself. If the parse yields nothing, every assertion
    // below passes for the wrong reason.
    assert.ok(HIDING_SELECTORS.length >= 3, `only ${HIDING_SELECTORS.length} selectors parsed`)
    assert.match(PRINT_BLOCK, /display:\s*none\s*!important/)
  })

  test('the document renders the landmark elements this is about', () => {
    // Likewise: if the letterhead stopped being a `header`, the sweep below
    // would have nothing to catch and would pass while proving nothing.
    for (const tag of ['header', 'footer']) {
      assert.ok(DOCUMENT_TAGS.has(tag), `the document no longer renders a <${tag}>`)
    }
  })

  for (const selector of HIDING_SELECTORS) {
    test(`\`${selector}\` cannot match part of the invoice`, () => {
      const compounds = splitTopLevel(selector, /[\s>+~]/)
      const target = compounds.at(-1) ?? ''

      for (const ancestor of compounds.slice(0, -1)) {
        assert.ok(
          !skeleton(ancestor).includes('.print-document'),
          'this rule descends from the document, so everything it hides is part of the invoice',
        )
      }

      const bare = skeleton(target)
      assert.ok(!bare.includes('.print-document'), 'this rule hides the document itself')

      const tag = /^([a-z][a-z0-9]*)/.exec(bare)?.[1]
      if (tag !== undefined && DOCUMENT_TAGS.has(tag)) {
        assert.match(
          target,
          /:not\([^)]*\.print-document/,
          `<${tag}> is an element the invoice is built from, so hiding it by tag name has to exclude the document`,
        )
      }

      // A class or attribute the document also carries would hide part of it
      // just as effectively as a tag name does.
      for (const className of bare.match(/\.[a-zA-Z][\w-]*/g) ?? []) {
        assert.ok(!PREVIEW.includes(className.slice(1)), `the document uses the class ${className}`)
      }

      for (const attribute of bare.match(/\[[a-zA-Z-]+/g) ?? []) {
        assert.ok(
          !PREVIEW.includes(attribute.slice(1)),
          `the document uses the attribute ${attribute.slice(1)}`,
        )
      }
    })
  }
})

describe('the whole document reaches paper', () => {
  /*
    Which fields live inside which landmark. The sweep above proves no rule can
    hide the document's `header` and `footer`; these tests are what make that
    meaningful, by pinning what those two elements actually carry. Move the
    invoice number out into a bare div and the sweep would still pass while the
    protection quietly drained away.
  */
  test('the letterhead and the terms are inside the printable region', () => {
    const article = PREVIEW.indexOf('<article')

    assert.ok(article > -1, 'the document root is gone')
    assert.ok(PREVIEW.indexOf('<header className') > article, 'the letterhead is outside the document')
    assert.ok(PREVIEW.indexOf('<footer className') > article, 'the terms block is outside the document')
  })

  test('the letterhead carries the seller and every identifying field', () => {
    assert.match(LETTERHEAD, /invoice\.seller\.name/)
    assert.match(LETTERHEAD, /PartyLines party=\{invoice\.seller\}/)
    assert.match(LETTERHEAD, /Invoice\s*<\/p>/)
    assert.match(LETTERHEAD, /invoice\.invoiceNumber/)
    assert.match(LETTERHEAD, /formatInvoiceDate\(invoice\.issueDate\)/)
    assert.match(LETTERHEAD, /formatInvoiceDate\(invoice\.dueDate\)/)
  })

  test('the document footer carries the payment terms and the notes', () => {
    assert.match(DOCUMENT_FOOT, /invoice\.terms/)
    assert.match(DOCUMENT_FOOT, /invoice\.notes/)
  })

  test('the letterhead keeps its two-column layout on paper', () => {
    // A print viewport is the page box, not a window, and it can land below the
    // `sm` breakpoint on a smaller sheet or a scaled print — at which point the
    // letterhead would silently stack. Stated for print as the columns are.
    assert.match(LETTERHEAD, /print:flex-row/)
    assert.match(LETTERHEAD, /print:text-right/)
  })
})

describe('the application does not print', () => {
  test('every hiding rule is scoped to a page that has a document', () => {
    // Without the :has() scope, every other page on the site would print blank.
    for (const selector of HIDING_SELECTORS) {
      assert.match(selector, /^body:has\(\.print-document\)\s/, `${selector} is unscoped`)
    }
  })

  test('a region a component marks as chrome is hidden', () => {
    assert.ok(
      HIDING_SELECTORS.some((selector) => selector.endsWith("[data-print='hide']")),
      'the data-print opt-out is no longer honoured',
    )
  })

  test('the site header and footer mark themselves rather than relying on their tag', () => {
    // The tag-name net still exists, but this attribute is the mechanism. It is
    // what keeps the site chrome off the page now that the net has to exclude
    // the document, and it is the half that survives a browser rejecting the
    // net's `:not()`.
    assert.match(LAYOUT_HEADER, /<header[^>]*data-print="hide"/)
    assert.match(LAYOUT_FOOTER, /<footer[^>]*data-print="hide"/)
  })

  test('the navigations are inside the marked header, so they print nothing', () => {
    // DesktopNav and MobileNav render their own <nav> elements. They stay off
    // paper because the header around them is marked, not because of their tag.
    assert.match(LAYOUT_HEADER, /<DesktopNav/)
    assert.match(LAYOUT_HEADER, /<MobileNav/)
  })

  test('advertising is hidden, so no slot can appear on the invoice', () => {
    // The document itself contains no slot — adPlacements.test.ts forbids one
    // anywhere under src/tools. This covers the page-level slots that ToolShell
    // renders around the tool: they are on the page while printing, so the
    // printable region excludes them here.
    assert.ok(
      HIDING_SELECTORS.some((selector) => selector.endsWith('.ad-slot')),
      'the ad slots are no longer hidden for print',
    )
    assert.ok(SHELL.includes('<AdSlot'), 'ToolShell no longer renders the slots this rule hides')
  })

  test('the page furniture inside the shell is marked, not just the outer layout', () => {
    for (const marked of ['ToolHeader', 'RelatedTools']) {
      const index = SHELL.indexOf(marked)
      assert.ok(index > -1, `${marked} is no longer in ToolShell`)
    }
    // Help and FAQ are useful on screen and noise on an invoice.
    assert.ok(
      (SHELL.match(/data-print="hide"/g) ?? []).length >= 3,
      'ToolShell marks fewer regions as screen-only than it used to',
    )
  })

  test('the editor column does not print', () => {
    assert.match(EDITOR, /data-print="hide"/)
  })

  test('the print button does not print itself', () => {
    // The control sits inside a wrapper marked screen-only; a button printed on
    // an invoice is the giveaway that it came out of a web page.
    const buttonIndex = EDITOR.indexOf('window.print()')
    assert.ok(buttonIndex > -1, 'the print button no longer calls window.print()')

    const wrapperIndex = EDITOR.lastIndexOf('data-print="hide"', buttonIndex)
    assert.ok(wrapperIndex > -1, 'the print button is not inside a screen-only wrapper')
  })

  test('the guidance line under the preview is screen-only', () => {
    // "Ready to print…" is an instruction to the person using the tool, not
    // something a customer should read on an invoice.
    const guidance = EDITOR.indexOf('Ready to print')
    assert.ok(guidance > -1, 'the readiness line is gone')
    assert.ok(
      EDITOR.lastIndexOf('data-print="hide"', guidance) > EDITOR.indexOf('<InvoicePreview'),
      'the readiness line is not marked screen-only',
    )
  })
})

describe('the printed sheet is laid out for paper', () => {
  test('the page has margins', () => {
    assert.match(CSS, /@page\s*\{[^}]*margin:\s*\d+mm/)
  })

  test('the document drops its on-screen card chrome', () => {
    for (const property of ['border', 'border-radius', 'box-shadow', 'padding']) {
      assert.match(
        PRINT_BLOCK,
        new RegExp(`${property}:[^;]*!important`),
        `${property} is not reset for print`,
      )
    }
  })

  test('totals and table rows are not split across sheets', () => {
    assert.match(PRINT_BLOCK, /break-inside:\s*avoid/)
    assert.match(PRINT_BLOCK, /\.print-keep-together/)
    assert.ok(PREVIEW.includes('print-keep-together'), 'the totals block is no longer marked')
  })

  test('nothing clips at a page break', () => {
    assert.match(PRINT_BLOCK, /overflow:\s*visible\s*!important/)
  })

  test('a sticky ancestor cannot pin the document to the first sheet', () => {
    assert.match(PRINT_BLOCK, /\*:has\(\.print-document\)/)
    assert.match(PRINT_BLOCK, /position:\s*static\s*!important/)
  })

  test('the quantity and unit-price columns come back for print', () => {
    // They are dropped on a narrow screen for room. Paper is always wide enough,
    // and an invoice without a unit price is not an invoice.
    const printColumns = PREVIEW.match(/print:table-cell/g) ?? []
    assert.ok(printColumns.length >= 4, `only ${printColumns.length} columns restored for print`)
  })

  test('the phone-only combined line is suppressed for print, so nothing doubles up', () => {
    assert.match(PREVIEW, /sm:hidden print:hidden/)
  })

  test('the printed columns are read through the engine, not re-parsed', () => {
    // The document shows quantity and unit price beside the amount computed from
    // them. Parsing the raw strings again here is how those three numbers end up
    // disagreeing on paper, so the document calls the same accessors the
    // arithmetic does.
    assert.match(PREVIEW, /itemQuantity\(item\)/)
    assert.match(PREVIEW, /money\(itemUnitPrice\(item\)\)/)
    assert.ok(!/Number\(item\.unitPrice\)/.test(PREVIEW), 'the document parses unit price itself')
    assert.ok(!/item\.quantity\.trim\(\)/.test(PREVIEW), 'the document parses quantity itself')
  })
})

describe('the document ignores the app theme', () => {
  // A dark-mode user must still send white paper. The doc tokens are declared
  // only in the light @theme and deliberately absent from .dark, so this is
  // structural rather than a print-time override.
  //
  // Matched as a rule at the start of a line: the phrase ".dark" also appears in
  // the comment explaining this, and slicing from there would sweep in the light
  // declarations it sits above.
  const darkRule = CSS.search(/^\.dark\s*\{/m)
  const darkBlock = blockAt(CSS, darkRule, '.dark')

  test('the dark block was actually found', () => {
    assert.ok(darkRule > -1, 'globals.css has no .dark rule')
    assert.match(darkBlock, /^\.dark\s*\{/)
    // Sanity check on the slice itself: the theme's own tokens *are* re-declared
    // here, so a passing test below means "doc tokens are absent", not "the
    // slice is empty".
    assert.match(darkBlock, /--color-surface:/)
  })

  test('the document palette is not redefined for dark mode', () => {
    for (const token of ['--color-doc:', '--color-doc-ink:', '--color-doc-muted:']) {
      assert.ok(!darkBlock.includes(token), `${token} is overridden in .dark`)
    }
  })

  test('the paper token exists in the first place', () => {
    assert.match(CSS, /--color-doc:\s*#ffffff/)
  })

  test('the document is built from doc tokens, not theme tokens', () => {
    assert.match(PREVIEW, /bg-doc\b/)
    assert.match(PREVIEW, /text-doc-ink\b/)

    // The theme's own surface tokens would invert at night.
    for (const themeToken of ['bg-surface', 'bg-canvas', 'text-ink"', 'border-line']) {
      assert.ok(!PREVIEW.includes(themeToken), `the document uses the theme token ${themeToken}`)
    }
  })

  test('no dark-mode variant is carried into the document', () => {
    assert.ok(!/\bdark:/.test(PREVIEW), 'the document carries a dark: variant')
  })
})
