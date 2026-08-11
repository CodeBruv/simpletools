import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'

import type { NavCategory } from '@/tools/registry'
import { getNavigationTree, getToolCategory } from '@/tools/registry'
import { TOOLS_PATH, categoryPath, toolPath } from '@/lib/paths'
import { cn } from '@/lib/utils'

/**
 * Desktop navigation: a category-first dropdown.
 *
 * Only the expanded category renders its tools. That is the property that
 * makes this scale — with two hundred tools the menu is still a short list of
 * categories, and the tool list is scrollable rather than unbounded.
 */
export default function DesktopNav() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const { pathname } = useLocation()

  const tree = getNavigationTree()

  // Opening on the current tool's category means the menu opens showing where
  // the user already is, rather than a collapsed list they must re-navigate.
  const currentCategorySlug = getToolCategory(pathname.split('/')[2] ?? '')?.slug

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return

    // Captured once: the cleanup must detach from the same node it attached to,
    // not from whatever the ref happens to hold when the effect tears down.
    const root = rootRef.current

    function onPointerDown(event: PointerEvent) {
      if (!root?.contains(event.target as Node)) setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    function onFocusOut(event: FocusEvent) {
      const next = event.relatedTarget as Node | null
      if (next && !root?.contains(next)) setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    root?.addEventListener('focusout', onFocusOut)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      root?.removeEventListener('focusout', onFocusOut)
    }
  }, [open])

  function toggleMenu() {
    setOpen((value) => {
      const next = !value
      if (next) setExpanded(currentCategorySlug ?? null)
      return next
    })
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-1 py-1 text-sm transition-colors',
          open || pathname.startsWith(TOOLS_PATH) ? 'font-medium text-ink' : 'text-muted hover:text-ink',
        )}
      >
        Tools
        <ChevronDown
          className={cn('size-4 transition-transform', open && 'rotate-180')}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute left-0 top-[calc(100%+10px)] z-50 w-[19rem] overflow-hidden rounded-xl border border-line-strong bg-surface shadow-lg shadow-black/[0.08]"
        >
          <nav aria-label="Tool categories" className="max-h-[70vh] overflow-y-auto py-1.5">
            {tree.map((entry) => (
              <CategoryRow
                key={entry.category.slug}
                entry={entry}
                expanded={expanded === entry.category.slug}
                onToggle={() =>
                  setExpanded((current) =>
                    current === entry.category.slug ? null : entry.category.slug,
                  )
                }
              />
            ))}
          </nav>

          <div className="border-t border-line px-1.5 py-1.5">
            <Link
              to={TOOLS_PATH}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted hover:bg-accent-soft hover:text-ink"
            >
              Browse all tools
              <ChevronRight className="size-4" strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: NavCategory
  expanded: boolean
  onToggle: () => void
}) {
  const { category, tools, availableCount } = entry
  const Icon = category.icon
  const listId = `desktop-nav-${category.slug}`

  return (
    <div className="px-1.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={listId}
        className={cn(
          'flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
          expanded ? 'text-ink' : 'text-muted hover:bg-accent-soft hover:text-ink',
        )}
      >
        <Icon className="size-4 shrink-0 text-accent" strokeWidth={1.75} aria-hidden="true" />
        <span className="flex-1 font-medium">{category.name}</span>
        {/*
          The digit is shorthand for sighted users; the sr-only phrase is what
          makes it mean something when read aloud. Announcing "Images 1" would
          not tell anyone what the 1 counts.
        */}
        <span className="eyebrow" aria-hidden="true">
          {availableCount > 0 ? availableCount : '–'}
        </span>
        <span className="sr-only">
          {availableCount > 0
            ? `${availableCount} of ${tools.length} tools available`
            : `${tools.length} tools coming soon`}
        </span>
        <ChevronDown
          className={cn('size-4 shrink-0 transition-transform', expanded && 'rotate-180')}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <ul id={listId} className="mb-1 ml-[1.65rem] border-l border-line pl-2">
          {tools.map((tool) => (
            <li key={tool.slug}>
              <Link
                to={toolPath(tool.slug)}
                className="flex min-h-10 items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted hover:bg-accent-soft hover:text-ink"
              >
                <span className="min-w-0 flex-1 truncate">{tool.name}</span>
                {tool.status === 'planned' && (
                  <>
                    <span className="eyebrow shrink-0" aria-hidden="true">
                      Soon
                    </span>
                    <span className="sr-only">Coming soon</span>
                  </>
                )}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to={categoryPath(category.slug)}
              className="block rounded-lg px-2.5 py-2 text-[13px] text-faint hover:text-accent"
            >
              All {category.name}
            </Link>
          </li>
        </ul>
      )}
    </div>
  )
}
