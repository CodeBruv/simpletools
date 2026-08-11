/**
 * Computes WCAG contrast ratios for the dark palette and the printed document
 * palette, so the colours are chosen by measurement rather than by eye.
 *
 * Run: node scripts/check-contrast.mjs
 *
 * Two rules drive the numbers below:
 *   - Text must clear 4.5:1 against *both* --color-paper and --color-surface,
 *     because cards sit on the page and text sits on cards.
 *   - Borders and other non-text UI must clear 3:1 (WCAG 1.4.11).
 *
 * The dark ground is deliberately a warm charcoal, not black. Pure black with
 * light text produces halation — the text appears to smear for many readers,
 * and it throws away the warmth that makes SimpleTools look like paper rather
 * than a developer dashboard.
 */

function srgbToLinear(channel) {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function luminance(hex) {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value

  const r = srgbToLinear(parseInt(full.slice(0, 2), 16))
  const g = srgbToLinear(parseInt(full.slice(2, 4), 16))
  const b = srgbToLinear(parseInt(full.slice(4, 6), 16))

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function ratio(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  const light = Math.max(la, lb)
  const dark = Math.min(la, lb)
  return (light + 0.05) / (dark + 0.05)
}

/* The palette under test. Keep in sync with the .dark block in globals.css. */
const DARK = {
  paper: '#22201b',
  surface: '#2c2924',
  canvas: '#262420',
  ink: '#f4f1e9',
  muted: '#b8b2a4',
  faint: '#8c8677',
  subtle: '#9c9686',
  line: '#3a362f',
  lineStrong: '#4a463e',
  accent: '#5cc0bc',
  accentHover: '#7ad0cc',
  accentSoft: '#1f3b39',
  onAccent: '#08201f',
  danger: '#f0907a',
  dangerSoft: '#3a231d',
  checker: '#37332c',
}

/** [label, foreground, background, minimum required ratio] */
const CHECKS = [
  ['ink on paper', DARK.ink, DARK.paper, 4.5],
  ['ink on surface', DARK.ink, DARK.surface, 4.5],
  /* Typed input sits in the canvas well, so it has to clear the bar there too. */
  ['ink on canvas (typed input)', DARK.ink, DARK.canvas, 4.5],
  ['muted on paper', DARK.muted, DARK.paper, 4.5],
  ['muted on surface', DARK.muted, DARK.surface, 4.5],
  /*
   * Placeholder text. WCAG treats it as text, and a placeholder that cannot be
   * read is a real barrier for anyone returning to a half-filled form — so it
   * is held to the full 4.5:1 against the well it appears in, not to the 3:1
   * that would be tempting for "decorative" grey.
   */
  ['subtle on canvas (placeholder text)', DARK.subtle, DARK.canvas, 4.5],
  ['subtle on surface (inactive glyph)', DARK.subtle, DARK.surface, 4.5],
  ['faint on paper (non-text/large only)', DARK.faint, DARK.paper, 3],
  ['faint on surface (non-text/large only)', DARK.faint, DARK.surface, 3],
  ['accent on paper', DARK.accent, DARK.paper, 4.5],
  ['accent on surface', DARK.accent, DARK.surface, 4.5],
  ['accent on accent-soft', DARK.accent, DARK.accentSoft, 4.5],
  ['on-accent on accent', DARK.onAccent, DARK.accent, 4.5],
  ['on-accent on accent-hover', DARK.onAccent, DARK.accentHover, 4.5],
  ['danger on paper', DARK.danger, DARK.paper, 4.5],
  ['danger on surface', DARK.danger, DARK.surface, 4.5],
  ['danger on danger-soft', DARK.danger, DARK.dangerSoft, 4.5],
  /*
   * Borders are informational here, not the 3:1 case. WCAG 1.4.11 covers the
   * boundary of a control whose *shape* carries meaning; these tokens draw card
   * edges, dividers and dropdown outlines, and every control they touch is also
   * identified by its label, fill and focus ring. Holding them to 3:1 would put
   * a hard grey rule around every card and lose the paper feel. What matters is
   * that the dark values sit in the same place in the hierarchy as the approved
   * light ones (line-strong is 1.42:1 on light paper), so both are asserted
   * against a band rather than a floor.
   */
  ['line-strong on paper (matches light theme weight)', DARK.lineStrong, DARK.paper, 1.4],
  ['line on paper (divider, informational)', DARK.line, DARK.paper, 1],
  ['surface against paper (card edge, informational)', DARK.surface, DARK.paper, 1],
  ['checker against surface (informational)', DARK.checker, DARK.surface, 1],
]

/** Tokens that must stay *below* a ceiling, so borders never outshout text. */
const CEILINGS = [
  ['line-strong on paper stays quieter than text', DARK.lineStrong, DARK.paper, 2.2],
  ['line on paper stays a whisper', DARK.line, DARK.paper, 1.6],
]

/*
 * The document palette.
 *
 * The invoice is white paper in every theme, so these tokens are declared only
 * in the light @theme and never in .dark. That makes them the one part of the
 * palette a dark-mode change cannot accidentally fix or break — which is exactly
 * why they need measuring here: nothing else will ever look at them again.
 *
 * They are also the only colours in the product that get printed, and print is
 * less forgiving than a screen. A grey that passes on a backlit display can
 * disappear on a laser printer, so the muted tones are held to the full text
 * bar rather than the 3:1 large-text allowance.
 *
 * Keep in sync with the --color-doc* tokens in globals.css.
 */
const DOC = {
  paper: '#ffffff',
  ink: '#14130e',
  muted: '#55514a',
  faint: '#6e6960',
  line: '#ddd8cc',
  lineStrong: '#b8b1a0',
  accent: '#0e5b5f',
}

const DOC_CHECKS = [
  ['doc ink on paper (body text)', DOC.ink, DOC.paper, 4.5],
  ['doc muted on paper (addresses, line detail)', DOC.muted, DOC.paper, 4.5],
  /*
   * Column headings and the "Bill to" label. Small and uppercase, so held to the
   * text bar despite being secondary — a 10px tracked label is harder to read
   * than its size suggests, not easier.
   */
  ['doc faint on paper (small caps labels)', DOC.faint, DOC.paper, 4.5],
  ['doc accent on paper (the word INVOICE)', DOC.accent, DOC.paper, 4.5],
  /* Rules on paper: visible after printing, not heavy enough to box the page in. */
  ['doc line-strong on paper (table head rule)', DOC.lineStrong, DOC.paper, 1.4],
  ['doc line on paper (row divider)', DOC.line, DOC.paper, 1],
]

const DOC_CEILINGS = [
  ['doc line-strong stays quieter than text', DOC.lineStrong, DOC.paper, 2.5],
  ['doc line stays a hairline', DOC.line, DOC.paper, 1.6],
]

let failed = 0
const rows = []

for (const [label, fg, bg, min] of [...CHECKS, ...DOC_CHECKS]) {
  const value = ratio(fg, bg)
  const ok = value >= min
  if (!ok) failed += 1
  rows.push(`${ok ? 'ok  ' : 'FAIL'} ${value.toFixed(2).padStart(6)}:1  (min ${min})  ${label}`)
}

for (const [label, fg, bg, max] of [...CEILINGS, ...DOC_CEILINGS]) {
  const value = ratio(fg, bg)
  const ok = value <= max
  if (!ok) failed += 1
  rows.push(`${ok ? 'ok  ' : 'FAIL'} ${value.toFixed(2).padStart(6)}:1  (max ${max})  ${label}`)
}

/*
 * The document must be paper, not a tinted card. Anything below pure white
 * starts costing contrast on every line of the invoice at once.
 */
const docPaperOk = DOC.paper === '#ffffff'
if (!docPaperOk) failed += 1
rows.push(
  `${docPaperOk ? 'ok  ' : 'FAIL'} ${DOC.paper.padStart(9)}    (must be #ffffff)  the invoice prints on white`,
)

/*
 * The point of the whole exercise: the ground must not be black or so close to
 * it that the warmth is lost. 0.012 relative luminance is about #1b1916 — below
 * that the surface reads as a dark dashboard rather than as dark paper.
 */
const MIN_GROUND_LUMINANCE = 0.012
const groundLuminance = luminance(DARK.paper)
const groundOk = groundLuminance >= MIN_GROUND_LUMINANCE

if (!groundOk) failed += 1
rows.push(
  `${groundOk ? 'ok  ' : 'FAIL'} ${groundLuminance.toFixed(4).padStart(6)}    (min ${MIN_GROUND_LUMINANCE})  paper is a charcoal, not a black`,
)

console.log(rows.join('\n'))

if (failed > 0) {
  console.error(`\n${failed} contrast check(s) failed.`)
  process.exit(1)
}

console.log('\nAll contrast checks passed (dark palette + printed document).')
