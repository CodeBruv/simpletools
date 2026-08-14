import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { renderToString } from 'react-dom/server'

const ROOT = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = dirname(ROOT)
const DIST = join(PROJECT_ROOT, 'dist')

const SITE_ORIGIN = 'https://www.simpletools.site'

async function main() {
  if (!existsSync(DIST)) {
    throw new Error('dist/ does not exist. Run the Vite build first.')
  }

  const templatePath = join(DIST, 'index.html')
  const template = await readFile(templatePath, 'utf8')

  /*
   * Load the browser application after Vite has built it.
   *
   * This gives the prerenderer the same React application that users receive,
   * rather than maintaining a second copy of the application's page structure.
   */
  const entryPath = join(DIST, 'assets', findEntryFile(template))

  if (!existsSync(entryPath)) {
    throw new Error(`Unable to find built application entry: ${entryPath}`)
  }

  console.log('Prerender foundation ready.')
  console.log(`Dist: ${DIST}`)
}

function findEntryFile(html) {
  const match = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)

  if (!match) {
    throw new Error('Could not find the Vite module entry in dist/index.html')
  }

  return match[1].replace(/^\/assets\//, '')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})