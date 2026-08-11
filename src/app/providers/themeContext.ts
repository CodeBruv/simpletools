import { createContext, useContext } from 'react'

import type { ResolvedTheme, ThemePreference } from '@/lib/theme'
import { DEFAULT_THEME_PREFERENCE } from '@/lib/theme'

export interface ThemeContextValue {
  /** What the user chose, including 'system'. */
  preference: ThemePreference
  /** What is actually painted right now. */
  resolved: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

/**
 * Defaults are inert rather than throwing, so a component rendered outside the
 * provider (a test, a Storybook-style harness) still renders in light mode.
 */
export const ThemeContext = createContext<ThemeContextValue>({
  preference: DEFAULT_THEME_PREFERENCE,
  resolved: 'light',
  setPreference: () => {},
})

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
