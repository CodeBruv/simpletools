import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

import DesktopNav from '@/components/layout/DesktopNav'
import Logo from '@/components/layout/Logo'
import MobileNav from '@/components/layout/MobileNav'
import PageContainer from '@/components/layout/PageContainer'
import ThemeToggle from '@/components/layout/ThemeToggle'
import ToolSearch from '@/components/tools/ToolSearch'
import { CATEGORIES_PATH } from '@/lib/paths'
import { cn } from '@/lib/utils'

/**
 * The single breakpoint that separates the two navigations.
 *
 * Tailwind's `lg` is 64rem, and the media query below must stay identical to
 * it: if they disagree, there is a band of widths where both navigations are
 * visible at once, or neither is.
 */
const DESKTOP_QUERY = '(min-width: 64rem)'
const MOBILE_NAV_ID = 'mobile-nav'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Close the mobile sheet on navigation.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // The sheet is hidden from the `lg` breakpoint up. Without this, rotating a
  // phone or widening a window while it is open would hide the sheet but leave
  // the body scroll lock in place, stranding the user on an unscrollable page.
  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY)

    function sync() {
      if (desktop.matches) setMenuOpen(false)
    }

    sync()
    desktop.addEventListener('change', sync)
    return () => desktop.removeEventListener('change', sync)
  }, [])

  // Lock body scroll while the sheet is open, and allow Escape to close it.
  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <header
      data-print="hide"
      className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md"
    >
      <PageContainer>
        <div className="flex h-16 items-center gap-4">
          <Logo />

          <nav aria-label="Main" className="ml-2 hidden items-center gap-5 lg:flex">
            <DesktopNav />
            <NavLink
              to={CATEGORIES_PATH}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-1 py-1 text-sm transition-colors',
                  isActive ? 'font-medium text-ink' : 'text-muted hover:text-ink',
                )
              }
            >
              Categories
            </NavLink>
          </nav>

          <div className="ml-auto hidden w-56 lg:block xl:w-72">
            <ToolSearch variant="compact" placeholder="Search tools…" />
          </div>

          <ThemeToggle className="ml-auto lg:ml-1" />

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls={MOBILE_NAV_ID}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="grid size-11 place-items-center rounded-lg border border-line-strong bg-surface text-ink lg:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </PageContainer>

      <MobileNav id={MOBILE_NAV_ID} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  )
}
