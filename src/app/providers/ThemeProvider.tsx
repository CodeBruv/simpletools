import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import type { ThemePreference } from '@/lib/theme'
import { DARK_CLASS, DARK_MEDIA_QUERY, resolveTheme, themeColor } from '@/lib/theme'
import type { ThemeStore } from '@/lib/themeStorage'
import { getDefaultThemeStore, readThemePreference, writeThemePreference } from '@/lib/themeStorage'
import { ThemeContext } from '@/app/providers/themeContext'

/**
 * Applies the appearance preference to the document.
 *
 * The initial class is set by an inline script in index.html so the first paint
 * is already correct; this provider takes over from there and keeps the two in
 * agreement. Both read the same key through the same rules.
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<ThemeStore | null>(null)

  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    storeRef.current = getDefaultThemeStore()
    return readThemePreference(storeRef.current)
  })

  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia(DARK_MEDIA_QUERY).matches,
  )

  // Follow the OS while the preference is 'system'. Tracked unconditionally so
  // switching back to 'system' is instantly correct rather than one tick stale.
  useEffect(() => {
    const query = window.matchMedia(DARK_MEDIA_QUERY)

    function sync(event: MediaQueryListEvent) {
      setSystemPrefersDark(event.matches)
    }

    setSystemPrefersDark(query.matches)
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  const resolved = resolveTheme(preference, systemPrefersDark)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle(DARK_CLASS, resolved === 'dark')

    // Tells the browser to paint native controls, scrollbars and form widgets
    // to match. Without it, dark pages get light scrollbars.
    root.style.colorScheme = resolved

    const meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    meta?.setAttribute('content', themeColor(resolved))
  }, [resolved])

  const setPreference = useCallback((next: ThemePreference) => {
    // Held in state regardless of whether the write succeeds, so the choice
    // still applies for this session when storage is blocked.
    setPreferenceState(next)
    writeThemePreference(storeRef.current, next)
  }, [])

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
