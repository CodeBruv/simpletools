import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/*
  Accessibility properties that survive as source facts rather than needing a
  browser: menu semantics, Escape handling, the sr-only companion for glyph-only
  status, and the 44px floor on the controls a thumb aims at.

  The project has no DOM test environment, so these read the components. That is
  a real limit — they prove the attribute is present, not that focus lands where
  it should. The manual pass covers the rest, and where a browser is unavailable
  the report says so.
*/

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url))

function read(relativePath: string): string {
  return readFileSync(join(PROJECT_ROOT, relativePath), 'utf8')
}

function uiFiles(): Array<{ path: string; source: string }> {
  const found: Array<{ path: string; source: string }> = []

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.tsx$/.test(entry)) found.push({ path: full, source: readFileSync(full, 'utf8') })
    }
  }

  walk(join(PROJECT_ROOT, 'src'))
  return found
}

const HEADER = read('src/components/layout/Header.tsx')
const BUTTON = read('src/components/ui/Button.tsx')
const DESKTOP_NAV = read('src/components/layout/DesktopNav.tsx')
const MOBILE_NAV = read('src/components/layout/MobileNav.tsx')
const TOOL_SEARCH = read('src/components/tools/ToolSearch.tsx')
const THEME_TOGGLE = read('src/components/layout/ThemeToggle.tsx')
const BREADCRUMB = read('src/components/ui/Breadcrumb.tsx')
const IMAGE_QUALITY_SLIDER = read('src/tools/image-compressor/QualitySlider.tsx')
const PDF_MODE_SELECTOR = read('src/tools/pdf-compressor/ModeSelector.tsx')
const QR_APPEARANCE = read('src/tools/qr-generator/AppearanceControls.tsx')
const GLOBALS_CSS = read('src/styles/globals.css')

describe('menus are dismissable and announce themselves', () => {
  const menus = [
    { name: 'DesktopNav', source: DESKTOP_NAV },
    { name: 'ThemeToggle', source: THEME_TOGGLE },
  ]

  test('each menu trigger declares that it opens a menu and whether it is open', () => {
    for (const { name, source } of menus) {
      assert.match(source, /aria-haspopup="true"/, `${name} trigger lacks aria-haspopup`)
      assert.match(source, /aria-expanded=\{open\}/, `${name} trigger lacks aria-expanded`)
      assert.match(source, /aria-controls=/, `${name} trigger lacks aria-controls`)
    }
  })

  test('each menu closes on Escape and returns focus to its trigger', () => {
    for (const { name, source } of menus) {
      assert.match(source, /event\.key === 'Escape'/, `${name} does not handle Escape`)
      assert.match(source, /triggerRef\.current\?\.focus\(\)/, `${name} strands focus on Escape`)
    }
  })

  test('each menu closes when focus or a pointer leaves it, so hover is never required', () => {
    for (const { name, source } of menus) {
      assert.match(source, /pointerdown/, `${name} does not close on outside pointer`)
      assert.match(source, /focusout/, `${name} does not close on focus leaving`)
    }
  })

  test('the mobile sheet closes on Escape and unlocks scroll when it does', () => {
    assert.match(HEADER, /event\.key === 'Escape'/)
    assert.match(HEADER, /document\.body\.style\.overflow = previousOverflow/)
  })

  test('the mobile sheet button says which action it performs', () => {
    assert.match(HEADER, /aria-label=\{menuOpen \? 'Close menu' : 'Open menu'\}/)
  })

  test('the mobile sheet owns focus from its trigger through every close path', () => {
    assert.match(HEADER, /ref=\{menuTriggerRef\}/)
    assert.match(HEADER, /triggerRef=\{menuTriggerRef\}/)
    assert.match(MOBILE_NAV, /ref=\{panelRef\}/)
    assert.match(MOBILE_NAV, /querySelector<HTMLInputElement>\('input:not\(\[disabled\]\)'\)/)
    assert.match(MOBILE_NAV, /event\.key !== 'Tab'/)
    assert.match(MOBILE_NAV, /event\.shiftKey && current === first/)
    assert.match(MOBILE_NAV, /!event\.shiftKey && current === last/)
    assert.match(MOBILE_NAV, /triggerRef\.current\?\.focus\(\)/)
  })

  test('the appearance menu is a radio group labelled with the current choice', () => {
    assert.match(THEME_TOGGLE, /role="menu"/)
    assert.match(THEME_TOGGLE, /role="menuitemradio"/)
    assert.match(THEME_TOGGLE, /aria-checked=\{selected\}/)
    assert.match(THEME_TOGGLE, /aria-label=\{`Appearance: \$\{currentLabel\}`\}/)
  })

  test('the appearance menu is arrow-key navigable', () => {
    assert.match(THEME_TOGGLE, /ArrowDown/)
    assert.match(THEME_TOGGLE, /ArrowUp/)
  })

  test('the appearance control is labelled "Appearance" for ordinary users', () => {
    assert.match(THEME_TOGGLE, />Appearance</)
  })
})

describe('touch targets on the controls a thumb aims at', () => {
  /*
    Tailwind's min-h-11 is 2.75rem — 44px, the figure in the spec. Asserted by
    class name because there is no layout engine here to measure with.
  */
  test('the mobile menu button is at least 44px square', () => {
    assert.match(HEADER, /size-11[^"]*lg:hidden|lg:hidden[^"]*size-11/)
  })

  test('the appearance trigger is 44px on mobile, 40px only from lg up', () => {
    assert.match(THEME_TOGGLE, /size-11 place-items-center[^']*lg:size-10/)
  })

  test('every appearance option is a 44px row', () => {
    assert.match(THEME_TOGGLE, /min-h-11 w-full items-center/)
  })

  test('the breadcrumb route back to the warehouse is a 44px target', () => {
    assert.match(BREADCRUMB, /min-h-11[^']*text-accent/)
  })

  test('desktop category rows and mobile drill-down rows are comfortable', () => {
    assert.match(DESKTOP_NAV, /min-h-11 w-full items-center/)
    // 3.25rem = 52px, deliberately larger than the floor on a phone.
    assert.match(MOBILE_NAV, /min-h-\[3\.25rem\]/)
    assert.match(MOBILE_NAV, /min-h-11 items-center gap-2 rounded-lg[^"]*text-accent/)
  })

  test('the mobile back-to-categories control is a 44px target', () => {
    assert.match(MOBILE_NAV, /min-h-11 items-center gap-2[^"]*text-accent/)
  })

  test('shared medium buttons preserve 40px fine-pointer density and grow for coarse pointers', () => {
    assert.match(BUTTON, /md: 'h-10 px-4 text-sm \[@media\(pointer:coarse\)\]:min-h-11'/)
    assert.match(BUTTON, /lg: 'h-12 px-6 text-\[15px\]'/)
  })

  test('the compact search clear control grows with enough coarse-pointer input padding', () => {
    assert.match(
      TOOL_SEARCH,
      /isHero\s+\? 'h-14 pl-12 pr-14 text-base'\s+: 'h-10 pl-10 pr-11 text-sm \[@media\(pointer:coarse\)\]:pr-14'/,
    )
    assert.match(TOOL_SEARCH, /isHero \? 'size-11' : 'size-9 \[@media\(pointer:coarse\)\]:size-11'/)
  })

  test('PDF and QR range controls use the explicit 44px slider treatment', () => {
    for (const [name, source] of [
      ['image quality', IMAGE_QUALITY_SLIDER],
      ['PDF quality', PDF_MODE_SELECTOR],
      ['QR border', QR_APPEARANCE],
    ] as const) {
      assert.match(source, /type="range"/, `${name} is not a range control`)
      assert.match(source, /h-11 w-full appearance-none/, `${name} lacks a 44px interaction box`)
      assert.match(source, /slider-runnable-track\]:h-2/, `${name} lacks the compact visible track`)
      assert.match(source, /slider-thumb\]:size-5/, `${name} lacks the touch-friendly thumb`)
    }
  })
})

describe('status is never communicated by colour alone', () => {
  test('the compression verdicts pair their colour with an icon', () => {
    for (const file of [
      'src/tools/image-compressor/ResultLedger.tsx',
      'src/tools/pdf-compressor/PdfResultLedger.tsx',
    ]) {
      const source = read(file)
      assert.match(source, /\bCheck\b/, `${file} has no success glyph`)
      assert.match(source, /AlertTriangle/, `${file} has no failure glyph`)
    }
  })

  test('glyph-only availability badges carry a spoken equivalent', () => {
    for (const source of [DESKTOP_NAV, MOBILE_NAV]) {
      // The abbreviated "Soon" chip is hidden from the reader and paired with
      // wording that stands on its own.
      assert.match(source, /aria-hidden="true">\s*Soon/)
      assert.match(source, /sr-only">Coming soon</)
    }
  })

  test('the desktop category count is spoken as a phrase, not a bare digit', () => {
    assert.match(DESKTOP_NAV, /sr-only/)
    assert.match(DESKTOP_NAV, /tools available|tools coming soon/)
  })
})

describe('motion and focus', () => {
  test('animation is disabled for users who ask for reduced motion', () => {
    assert.match(GLOBALS_CSS, /prefers-reduced-motion/)
  })

  test('a visible focus style is defined globally rather than removed', () => {
    assert.match(GLOBALS_CSS, /:focus-visible/)
    assert.ok(
      !/outline:\s*none/.test(GLOBALS_CSS.replace(/:focus-visible[\s\S]*?\}/g, '')),
      'focus outline is removed outside a focus-visible rule',
    )
  })

  test('no component sets a positive tabindex, which would scramble tab order', () => {
    for (const { path, source } of uiFiles()) {
      for (const match of source.matchAll(/tabIndex=\{?(-?\d+)/g)) {
        assert.ok(Number(match[1]) <= 0, `${path} sets tabIndex=${match[1]}`)
      }
    }
  })

  test('no interactive element is built from a div with a click handler', () => {
    for (const { path, source } of uiFiles()) {
      assert.ok(
        !/<div[^>]*\sonClick=/.test(source),
        `${path} puts a click handler on a div instead of a button`,
      )
    }
  })
})
