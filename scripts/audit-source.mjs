/**
 * Static source audit. Runs without node_modules, so it works even when the
 * npm registry is unreachable.
 *
 * Checks:
 *  1. Every .ts/.tsx file parses (syntactic diagnostics from the real TS parser).
 *  2. Every internal import ('@/...' or relative) resolves to a real file,
 *     matched CASE-SENSITIVELY.
 *  3. No two source paths differ only by letter case. This one matters: Vite
 *     resolves '.ts' before '.tsx', so on Windows or macOS a component named
 *     Foo.tsx sitting next to a logic module named foo.ts causes the import of
 *     'Foo' to load foo.ts instead. It builds fine on Linux/CI and breaks on a
 *     developer's laptop.
 *  4. No network, storage, or dynamic-code APIs outside test files.
 *  5. The one storage exemption (the appearance preference) still stores only
 *     that, under only its own key.
 *
 * Usage: node scripts/audit-source.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve, dirname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/**
 * Prefer the project's own TypeScript. The fallback is only for environments
 * where node_modules could not be installed; it is skipped silently when the
 * normal install is present.
 */
function loadTypeScript() {
  try {
    return require('typescript')
  } catch {
    try {
      return require('/usr/local/lib/node_modules_global/lib/node_modules/typescript')
    } catch {
      console.error('Could not load TypeScript. Run `npm install` first.')
      process.exit(1)
    }
  }
}

const ts = loadTypeScript()

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const EXTENSIONS = ['.ts', '.tsx']
const RESOLVE_ORDER = ['.ts', '.tsx', '/index.ts', '/index.tsx']

const failures = []
const notes = []

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (EXTENSIONS.some((e) => entry.endsWith(e))) out.push(full)
  }
  return out
}

const files = walk(SRC).sort()

// ---------------------------------------------------------------- 1. parsing
let parsed = 0
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX)
  const diags = sf.parseDiagnostics ?? []
  if (diags.length) {
    for (const d of diags) {
      const { line } = sf.getLineAndCharacterOfPosition(d.start)
      failures.push(
        `PARSE ${relative(ROOT, file)}:${line + 1} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`,
      )
    }
  }
  parsed += 1
}

// ------------------------------------------------------------- 2. resolution
/** Case-sensitive existence check, so a Linux CI catches Windows-only breakage. */
function existsExact(path) {
  const dir = dirname(path)
  const base = path.slice(dir.length + 1)
  try {
    return readdirSync(dir).includes(base)
  } catch {
    return false
  }
}

let imports = 0
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX)

  const specifiers = []
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text)
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text)
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)

  for (const spec of specifiers) {
    let base
    if (spec.startsWith('@/')) base = join(SRC, spec.slice(2))
    else if (spec.startsWith('.')) base = resolve(dirname(file), spec)
    else continue // bare package specifier — resolved by the bundler

    imports += 1

    // Asset imports (CSS, SVG, images) already carry their extension and are
    // handled by Vite, so check them exactly as written.
    const candidates = /\.[a-z0-9]+$/i.test(spec) && !/\.tsx?$/.test(spec)
      ? [base]
      : RESOLVE_ORDER.map((s) => base + s)

    if (!candidates.find(existsExact)) {
      failures.push(`UNRESOLVED ${relative(ROOT, file)} -> '${spec}'`)
    }
  }
}

// -------------------------------------------------- 3. case-only collisions
const byLower = new Map()
for (const file of files) {
  const key = relative(ROOT, file).toLowerCase()
  // Vite tries .ts before .tsx, so Foo.tsx and foo.ts collide on a
  // case-insensitive filesystem. Compare with the extension stripped.
  const stem = key.replace(/\.tsx?$/, '')
  if (!byLower.has(stem)) byLower.set(stem, [])
  byLower.get(stem).push(relative(ROOT, file))
}
for (const [stem, group] of byLower) {
  if (group.length > 1) {
    failures.push(`CASE COLLISION '${stem}': ${group.join('  vs  ')}`)
  }
}

// ------------------------------------------------------- 4. forbidden APIs
const FORBIDDEN = [
  [/\bfetch\s*\(/, 'fetch()'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bWebSocket\b/, 'WebSocket'],
  [/\bEventSource\b/, 'EventSource'],
  [/\bsendBeacon\b/, 'navigator.sendBeacon'],
  [/\blocalStorage\b/, 'localStorage'],
  [/\bsessionStorage\b/, 'sessionStorage'],
  [/\bindexedDB\b/, 'indexedDB'],
  [/document\s*\.\s*cookie/, 'document.cookie'],
  [/\beval\s*\(/, 'eval()'],
  [/new\s+Function\s*\(/, 'new Function()'],
  [/\.innerHTML\b/, 'innerHTML'],
  [/dangerouslySetInnerHTML/, 'dangerouslySetInnerHTML'],
]

/*
  The single sanctioned storage site.

  One file may reach for localStorage, and only to remember the appearance
  preference. The exemption is a (file, API) pair rather than a blanket
  allowance: every other file in the repo still fails on localStorage, and this
  file still fails on every other forbidden API. Section 5 below then checks
  that the file has not quietly grown into general-purpose persistence.
*/
const STORAGE_EXEMPTION = { file: 'src/lib/themeStorage.ts', api: 'localStorage' }

function isExempt(file, label) {
  return (
    label === STORAGE_EXEMPTION.api &&
    relative(ROOT, file).split(sep).join('/') === STORAGE_EXEMPTION.file
  )
}

let scanned = 0
for (const file of files) {
  if (file.endsWith('.test.ts')) continue // tests trap these on purpose
  scanned += 1
  const text = readFileSync(file, 'utf8')
  text.split('\n').forEach((line, i) => {
    for (const [pattern, label] of FORBIDDEN) {
      if (pattern.test(line) && !isExempt(file, label)) {
        failures.push(`FORBIDDEN ${label} at ${relative(ROOT, file)}:${i + 1}`)
      }
    }
  })
}

// -------------------------------------------- 5. the storage exemption itself
const exemptPath = join(ROOT, STORAGE_EXEMPTION.file)

if (!existsSync(exemptPath)) {
  failures.push(
    `STORAGE EXEMPTION names ${STORAGE_EXEMPTION.file}, which does not exist. ` +
      'Remove the exemption rather than leaving it pointing at nothing.',
  )
} else {
  const text = readFileSync(exemptPath, 'utf8')

  // The one key it may write. A second key would mean a second thing is being
  // remembered, which is exactly what this audit exists to prevent.
  const keys = [...text.matchAll(/'(simpletools-[a-z-]+)'/g)].map((m) => m[1])
  const unique = [...new Set(keys)]

  if (!unique.includes('simpletools-theme')) {
    failures.push(`STORAGE EXEMPTION: ${STORAGE_EXEMPTION.file} does not use the 'simpletools-theme' key.`)
  }
  for (const key of unique) {
    if (key !== 'simpletools-theme') {
      failures.push(`STORAGE EXEMPTION: ${STORAGE_EXEMPTION.file} writes an extra key '${key}'.`)
    }
  }

  // Writes must be normalised first, so only 'system' | 'light' | 'dark' can
  // ever reach the store — a filename or file body structurally cannot.
  if (!text.includes('normaliseThemePreference')) {
    failures.push(
      `STORAGE EXEMPTION: ${STORAGE_EXEMPTION.file} must pass values through ` +
        'normaliseThemePreference so only appearance preferences can be stored.',
    )
  }
}

notes.push(`storage exemption: ${STORAGE_EXEMPTION.file} (appearance preference only)`)

notes.push(`${parsed} files parsed`)
notes.push(`${imports} internal imports resolved case-sensitively`)
notes.push(`${byLower.size} unique path stems, no case collisions`)
notes.push(`${scanned} non-test files scanned for network/storage/dynamic-code APIs`)

if (failures.length) {
  console.error('Source audit FAILED\n')
  for (const f of failures) console.error('  ' + f)
  console.error(`\n${failures.length} problem(s).`)
  process.exit(1)
}

console.log('Source audit passed.')
for (const n of notes) console.log('  - ' + n)
