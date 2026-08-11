import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'

import { searchTools } from '@/tools/registry'
import { toolPath } from '@/lib/paths'
import { cn } from '@/lib/utils'

interface ToolSearchProps {
  /** 'hero' is the large homepage field; 'compact' sits in the header. */
  variant?: 'hero' | 'compact'
  placeholder?: string
  autoFocus?: boolean
  className?: string
  onNavigate?: () => void
}

const MAX_RESULTS = 5

export default function ToolSearch({
  variant = 'hero',
  placeholder = 'Search tools…',
  autoFocus = false,
  className,
  onNavigate,
}: ToolSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  const results = useMemo(() => searchTools(query).slice(0, MAX_RESULTS), [query])
  const showPanel = open && query.trim().length > 0

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!showPanel) return

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [showPanel])

  function goTo(slug: string) {
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
    onNavigate?.()
    navigate(toolPath(slug))
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }

    if (!showPanel || results.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => (i + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => (i - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      const tool = results[activeIndex]
      if (tool) {
        event.preventDefault()
        goTo(tool.slug)
      }
    }
  }

  const isHero = variant === 'hero'

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div className="relative">
        <Search
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint',
            isHero ? 'size-5' : 'size-4',
          )}
          strokeWidth={2}
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label="Search tools"
          aria-activedescendant={
            showPanel && results.length > 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            'w-full rounded-xl border bg-surface text-ink placeholder:text-faint',
            'border-line-strong focus:border-accent',
            // Suppress the native search clear affordance so the field reads
            // the same across browsers.
            '[&::-webkit-search-cancel-button]:appearance-none',
            // Right padding clears the clear-button's hit area, not just its
            // glyph, so a long query cannot run underneath it.
            isHero ? 'h-14 pl-12 pr-14 text-base' : 'h-10 pl-10 pr-11 text-sm',
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
            className={cn(
              // Sized to the field rather than to the glyph: a 24px hit area on
              // a phone is a miss waiting to happen. The input's right padding
              // above reserves room for exactly this.
              'absolute right-2 top-1/2 grid -translate-y-1/2 place-items-center rounded-md text-faint hover:text-ink',
              isHero ? 'size-11' : 'size-9',
            )}
          >
            <X className={isHero ? 'size-5' : 'size-4'} strokeWidth={2} />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-xl border border-line-strong bg-surface shadow-lg shadow-black/[0.06]">
          {results.length === 0 ? (
            <p className="px-4 py-3.5 text-sm text-muted">
              Nothing matches “{query.trim()}”. More tools are on the way.
            </p>
          ) : (
            <ul id={listboxId} role="listbox" aria-label="Tool results" className="py-1">
              {results.map((tool, index) => {
                const Icon = tool.icon
                const active = index === activeIndex

                return (
                  <li key={tool.slug} role="none">
                    <button
                      type="button"
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goTo(tool.slug)}
                      className={cn(
                        'flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left',
                        active && 'bg-accent-soft',
                      )}
                    >
                      <Icon className="size-4 shrink-0 text-accent" strokeWidth={1.75} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {tool.name}
                        </span>
                        <span className="block truncate text-xs text-muted">
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
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
