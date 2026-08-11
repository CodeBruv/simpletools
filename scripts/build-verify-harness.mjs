/**
 * Builds verify/index.html: a standalone page that runs the *real* Image
 * Compressor source against real image data in a real browser.
 *
 * Unit tests substitute a fake canvas, which proves the algorithm but not that
 * a browser encoder actually shrinks a photograph. This harness closes that
 * gap. It strips the types from the actual source files — it does not
 * reimplement them — so a regression in src/ shows up here.
 *
 * Everything is inlined into a single HTML file because browsers refuse to
 * load ES module imports over file://, and this page must open with a
 * double-click rather than needing a server.
 *
 * Run: npm run verify:build, then open verify/index.html.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const VERIFY = path.join(ROOT, 'verify')

/** Strip types from a real source file and drop its import statements. */
function emit(relativeSource) {
  const source = readFileSync(path.join(ROOT, relativeSource), 'utf8')
  const js = stripTypeScriptTypes(source, { mode: 'strip' })

  // Every import in these two modules is either type-only (already erased) or
  // resolved by concatenation, so the statements themselves can go.
  const withoutImports = js.replace(/^import\s[^\n]*\n/gm, '')

  if (/^\s*import\s/m.test(withoutImports)) {
    throw new Error(`${relativeSource}: an import survived stripping`)
  }

  return `// ---- ${relativeSource} ----\n${withoutImports}`
}

const modules = [emit('src/lib/file.ts'), emit('src/tools/image-compressor/compressImage.ts')]

// The concatenated scope has no module boundaries, so `export` is meaningless.
const bundle = modules.join('\n').replace(/^export\s+/gm, '')

/** Inline the fixtures so the page needs no server and no file picker. */
const FIXTURES = {
  'photo.jpg': 'image/jpeg',
  'logo-transparent.png': 'image/png',
  'screenshot.webp': 'image/webp',
  'corrupt.png': 'image/png',
  'notes.pdf': 'application/pdf',
}

const fixtures = Object.entries(FIXTURES)
  .map(([name, type]) => {
    const base64 = readFileSync(path.join(VERIFY, 'fixtures', name)).toString('base64')
    return `  { name: ${JSON.stringify(name)}, type: ${JSON.stringify(type)}, base64: '${base64}' }`
  })
  .join(',\n')

const checks = readFileSync(path.join(VERIFY, 'checks.js'), 'utf8')

const html = readFileSync(path.join(VERIFY, 'harness.html'), 'utf8')
  .replace('/*__SOURCE__*/', () => bundle)
  .replace('/*__FIXTURES__*/', () => `const FIXTURES = [\n${fixtures},\n]`)
  .replace('/*__CHECKS__*/', () => checks)

writeFileSync(path.join(VERIFY, 'index.html'), html)

const kb = (n) => `${(n / 1024).toFixed(0)} KB`
console.log(`Built verify/index.html (${kb(html.length)}) from real source.`)
console.log('Open it in a browser — no server needed.')
