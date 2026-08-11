/** Registers the test-only module resolver. See test-resolver.mjs. */
import { register } from 'node:module'

register('./test-resolver.mjs', import.meta.url)
