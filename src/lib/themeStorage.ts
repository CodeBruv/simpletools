/**
 * The only module in SimpleTools that touches persistent storage.
 *
 * Exactly one key is written, holding exactly one of three literal strings.
 * That is enforced structurally, not by convention: every write goes through
 * `normaliseThemePreference`, so an arbitrary value — a filename, a data URL,
 * anything a user opened — cannot reach storage even if a caller passed it.
 *
 * User files are never persisted anywhere. The source audit and the lint
 * config both single this file out, so a second storage site elsewhere fails
 * the build rather than slipping through review.
 */
import type { ThemePreference } from '@/lib/theme'
import { DEFAULT_THEME_PREFERENCE, normaliseThemePreference } from '@/lib/theme'

/** Namespaced so it cannot collide with anything else on the origin. */
export const THEME_STORAGE_KEY = 'simpletools-theme'

/**
 * The slice of the Storage API this module uses. Narrow on purpose: there is
 * no `clear`, no `key`, no iteration, so this module cannot read or remove
 * anything it did not write.
 */
export interface ThemeStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/**
 * Returns null when storage is unavailable rather than throwing.
 *
 * Private browsing modes and cookie-blocking settings make `localStorage`
 * throw on access, not just on write. A visitor in that state should still get
 * a working site that simply follows their OS preference.
 */
export function getDefaultThemeStore(): ThemeStore | null {
  try {
    // eslint-disable-next-line no-restricted-globals -- the single sanctioned storage site; see module comment
    const store = localStorage
    const probe = '__simpletools_probe__'
    store.setItem(probe, probe)
    store.removeItem(probe)
    return store
  } catch {
    return null
  }
}

export function readThemePreference(store: ThemeStore | null): ThemePreference {
  if (!store) return DEFAULT_THEME_PREFERENCE

  try {
    return normaliseThemePreference(store.getItem(THEME_STORAGE_KEY))
  } catch {
    return DEFAULT_THEME_PREFERENCE
  }
}

/**
 * Persist the preference. Reports whether it stuck, so callers can keep the
 * chosen appearance in memory for the session even when storage is blocked.
 */
export function writeThemePreference(
  store: ThemeStore | null,
  preference: ThemePreference,
): boolean {
  if (!store) return false

  try {
    store.setItem(THEME_STORAGE_KEY, normaliseThemePreference(preference))
    return true
  } catch {
    return false
  }
}
