/**
 * Appearance preference logic.
 *
 * Pure: no DOM, no storage, no React. Everything here is a function of its
 * arguments, which is what lets the rules be tested directly.
 */

/** What the user chose. 'system' defers to the OS or browser setting. */
export type ThemePreference = 'system' | 'light' | 'dark'

/** What actually gets painted. 'system' has already been resolved away. */
export type ResolvedTheme = 'light' | 'dark'

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'] as const

/** System, so a first-time visitor sees what their OS already asked for. */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system'

export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

/**
 * The single class name toggled on <html>. Dark mode works by re-declaring the
 * design tokens under this class, so existing components need no dark variants.
 */
export const DARK_CLASS = 'dark'

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value)
}

/**
 * Narrow an untrusted value to a usable preference.
 *
 * Anything unrecognised — a stale key from an older build, a value someone
 * typed into devtools, a truncated string — falls back to the default rather
 * than leaving the UI in an undefined state.
 */
export function normaliseThemePreference(value: unknown): ThemePreference {
  return isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light'
  return preference
}

/** Matches the browser bar to the painted background. */
export function themeColor(theme: ResolvedTheme): string {
  return theme === 'dark' ? '#22201B' : '#FBF9F5'
}

export interface ThemeOption {
  value: ThemePreference
  label: string
}

/** Labels for the appearance control, in the order they are shown. */
export const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const
