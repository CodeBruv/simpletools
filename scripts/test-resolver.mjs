/**
 * Module resolver for `node --test`.
 *
 * Vite and TypeScript understand the `@/` alias and extensionless imports;
 * Node's ESM resolver does not. This hook teaches Node both, so tests execute
 * the real source files rather than a transpiled copy of them.
 *
 * It also maps `react` and `lucide-react` to tiny local stubs. The registry
 * imports icons and `lazy()` purely as data, and stubbing them keeps the pure
 * registry logic testable without a full dependency install.
 *
 * Test-only. Nothing here ships in the browser bundle.
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'src')

const STUBS = {
  react: path.join(import.meta.dirname, 'test-stubs/react.mjs'),
  'lucide-react': path.join(import.meta.dirname, 'test-stubs/lucide-react.mjs'),
}

const CANDIDATE_SUFFIXES = ['', '.ts', '.tsx', '.mjs', '.js', '/index.ts', '/index.tsx']

function resolveFile(base) {
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = base + suffix
    if (suffix === '' && !path.extname(candidate)) continue
    if (existsSync(candidate)) return candidate
  }
  return null
}

export async function resolve(specifier, context, nextResolve) {
  const stub = STUBS[specifier]
  if (stub) {
    return { url: pathToFileURL(stub).href, shortCircuit: true }
  }

  if (specifier.startsWith('@/')) {
    const hit = resolveFile(path.join(SRC, specifier.slice(2)))
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true }
  }

  // Relative imports without an extension, e.g. './types'.
  if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL))
    const hit = resolveFile(path.resolve(parentDir, specifier))
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true }
  }

  return nextResolve(specifier, context)
}
