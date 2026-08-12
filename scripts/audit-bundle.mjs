#!/usr/bin/env node
/**
 * Eager-bundle guard.
 *
 * Walks the *static* import graph from the app entry point and fails if a
 * heavy tool engine is reachable without a dynamic import. Tool components are
 * registered via `lazy(() => import(...))`, so their engines should never be in
 * the first payload — but that guarantee is invisible in a diff, and one
 * accidental top-level import silently undoes it. Hence a check that runs.
 *
 * Dynamic `import(...)` calls are stripped before matching, because those are
 * exactly the boundaries the bundler splits on.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const ROOT = process.cwd()
const ENTRY = 'src/main.tsx'

/** Modules that must stay behind a dynamic import. */
const MUST_BE_LAZY = [
  'src/tools/qr-generator/qrEncoder.ts',
  'src/tools/qr-generator/render.ts',
  'src/tools/qr-generator/payloads.ts',
  'src/tools/qr-generator/QrGenerator.tsx',
  'src/tools/qr-generator/QrFieldset.tsx',
  'src/tools/qr-generator/AppearanceControls.tsx',
  'src/tools/image-compressor/ImageCompressor.tsx',
  'src/tools/pdf-compressor/PdfCompressor.tsx',
  'src/tools/pdf-compressor/compressPdf.ts',
  'src/tools/invoice-generator/InvoiceGenerator.tsx',
  'src/tools/invoice-generator/InvoicePreview.tsx',
  'src/tools/invoice-generator/InvoiceItems.tsx',
  'src/tools/invoice-generator/InvoiceField.tsx',
  'src/tools/invoice-generator/PartyFields.tsx',
  'src/tools/invoice-generator/calculateInvoice.ts',
  'src/tools/invoice-generator/currencies.ts',
  'src/tools/invoice-generator/invoiceDefaults.ts',
  'src/tools/invoice-generator/validateInvoice.ts',
  'src/tools/profit-margin/ProfitMargin.tsx',
  'src/tools/profit-margin/MarginResults.tsx',
  'src/tools/profit-margin/MarginField.tsx',
  'src/tools/profit-margin/calculateMargin.ts',
  'src/tools/profit-margin/marginInputs.ts',
  'src/tools/profit-margin/marginSummary.ts',
]

/** Removes dynamic import calls so only static edges are matched. */
function staticSourceOnly(code) {
  return code.replace(/\bimport\s*\(\s*'[^']*'\s*\)/g, 'import(/*dynamic*/)')
}

/** Static edges: `from '...'` and bare `import '...'`. */
function staticSpecifiers(code) {
  const source = staticSourceOnly(code)
  const found = []

  for (const [, spec] of source.matchAll(/\bfrom\s*'([^']+)'/g)) found.push(spec)
  for (const [, spec] of source.matchAll(/^\s*import\s+'([^']+)'/gm)) found.push(spec)

  return found
}

function resolveFile(base) {
  for (const ext of ['', '.ts', '.tsx', '.js', '/index.ts', '/index.tsx']) {
    if (existsSync(base + ext)) return base + ext
  }
  return null
}

function resolveSpecifier(fromFile, spec) {
  if (spec.startsWith('@/')) return resolveFile(join(ROOT, 'src', spec.slice(2)))
  if (spec.startsWith('.')) return resolveFile(resolve(dirname(fromFile), spec))
  return null // bare package specifier
}

const seen = new Set()
const stack = [resolve(ROOT, ENTRY)]
/** How each module was first reached, for a readable failure. */
const reachedVia = new Map()

while (stack.length > 0) {
  const file = stack.pop()
  if (seen.has(file)) continue
  seen.add(file)

  for (const spec of staticSpecifiers(readFileSync(file, 'utf8'))) {
    const resolved = resolveSpecifier(file, spec)
    if (!resolved || seen.has(resolved)) continue

    if (!reachedVia.has(resolved)) reachedVia.set(resolved, relative(ROOT, file))
    stack.push(resolved)
  }
}

const leaked = MUST_BE_LAZY.filter((target) => seen.has(resolve(ROOT, target)))

if (leaked.length > 0) {
  console.error('Eager bundle check FAILED — these should be behind a dynamic import:')
  for (const target of leaked) {
    console.error(`  ${target}  (imported by ${reachedVia.get(resolve(ROOT, target)) ?? 'entry'})`)
  }
  process.exit(1)
}

console.log('Eager bundle check passed.')
console.log(`  - entry: ${ENTRY}`)
console.log(`  - ${seen.size} modules in the eager graph`)
console.log(`  - ${MUST_BE_LAZY.length} heavy modules confirmed absent from it`)
