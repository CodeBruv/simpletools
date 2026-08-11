import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'

import { getNavigationTree } from '@/tools/registry'
import { CATEGORIES_PATH, TOOLS_PATH, categoryPath, toolPath } from '@/lib/paths'
import PageContainer from '@/components/layout/PageContainer'
import ToolSearch from '@/components/tools/ToolSearch'

interface MobileNavProps {
  id: string
  open: boolean
  onClose: () => void
}

/**
 * Mobile navigation: a two-pane drill-down, not a shrunken desktop menu.
 *
 * Pane one lists categories. Tapping one replaces the pane with that
 * category's tools, so only one list is ever on screen no matter how large the
 * registry grows. Rows are sized for thumbs rather than cursors.
 */
export default function MobileNav({ id, open, onClose }: MobileNavProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const backRef = useRef<HTMLButtonElement>(null)

  const tree = getNavigationTree()
  const active = tree.find((entry) => entry.category.slug === activeSlug)

  // Reopening should start at the top of the hierarchy, not wherever the user
  // happened to be last time.
  useEffect(() => {
    if (!open) setActiveSlug(null)
  }, [open])

  // Drilling in replaces the visible content, so focus has to follow or a
  // screen-reader user is left reading a pane that no longer exists.
  useEffect(() => {
    if (active) backRef.current?.focus()
  }, [active])

  if (!open) return null

  return (
    <div id={id} className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-paper lg:hidden">
      <PageContainer className="pb-6 pt-4">
        {active ? (
          <>
            <button
              ref={backRef}
              type="button"
              onClick={() => setActiveSlug(null)}
              className="-ml-1 inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-medium text-accent"
            >
              <ArrowLeft className="size-4" strokeWidth={2} aria-hidden="true" />
              All categories
            </button>

            <h2 className="mt-1 text-[17px] font-semibold text-ink">{active.category.name}</h2>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
              {active.category.description}
            </p>

            <nav aria-label={`${active.category.name} tools`} className="mt-3 flex flex-col">
              {active.tools.map((tool) => {
                const Icon = tool.icon

                return (
                  <Link
                    key={tool.slug}
                    to={toolPath(tool.slug)}
                    onClick={onClose}
                    className="flex min-h-[3.25rem] items-center gap-3 rounded-lg border-b border-line px-1 py-2 last:border-b-0"
                  >
                    <Icon className="size-[18px] shrink-0 text-accent" strokeWidth={1.75} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-ink">
                        {tool.name}
                      </span>
                      <span className="block truncate text-[13px] text-muted">
                        {tool.description}
                      </span>
                    </span>
                    {tool.status === 'planned' && (
                      <>
                        <span className="eyebrow shrink-0" aria-hidden="true">
                          Soon
                        </span>
                        <span className="sr-only">Coming soon</span>
                      </>
                    )}
                  </Link>
                )
              })}
            </nav>

            <Link
              to={categoryPath(active.category.slug)}
              onClick={onClose}
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-sm text-muted"
            >
              Open {active.category.name} page
              <ChevronRight className="size-4" strokeWidth={2} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <>
            <ToolSearch variant="compact" placeholder="Search tools…" onNavigate={onClose} />

            <p className="eyebrow mt-5">Categories</p>
            <nav aria-label="Tool categories" className="mt-2 flex flex-col">
              {tree.map(({ category, tools, availableCount }) => {
                const Icon = category.icon

                return (
                  <button
                    key={category.slug}
                    type="button"
                    onClick={() => setActiveSlug(category.slug)}
                    className="flex min-h-[3.25rem] items-center gap-3 rounded-lg border-b border-line px-1 py-2 text-left last:border-b-0"
                  >
                    <Icon className="size-[18px] shrink-0 text-accent" strokeWidth={1.75} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-ink">
                        {category.name}
                      </span>
                      <span className="block text-[13px] text-muted">
                        {availableCount > 0
                          ? `${availableCount} of ${tools.length} available`
                          : `${tools.length} coming soon`}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-faint" strokeWidth={2} aria-hidden="true" />
                  </button>
                )
              })}
            </nav>

            <nav aria-label="Browse" className="mt-4 flex flex-col gap-1 border-t border-line pt-3">
              <Link
                to={TOOLS_PATH}
                onClick={onClose}
                className="flex min-h-11 items-center rounded-lg px-1 text-[15px] text-muted"
              >
                All tools
              </Link>
              <Link
                to={CATEGORIES_PATH}
                onClick={onClose}
                className="flex min-h-11 items-center rounded-lg px-1 text-[15px] text-muted"
              >
                All categories
              </Link>
            </nav>
          </>
        )}
      </PageContainer>
    </div>
  )
}
