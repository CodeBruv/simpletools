import { useEffect, useId, useRef, useState } from 'react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { ThemePreference } from '@/lib/theme'
import { THEME_OPTIONS } from '@/lib/theme'
import { useTheme } from '@/app/providers/themeContext'
import { cn } from '@/lib/utils'

const ICONS: Record<ThemePreference, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
}

/**
 * Compact appearance control: System, Light, Dark.
 *
 * A menu rather than a cycling button, because a three-state cycle gives no
 * indication of what the next press does. The trigger shows the *preference*,
 * not the resolved theme, so 'System' stays visible as a distinct state.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme()
  const [open, setOpen] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const TriggerIcon = ICONS[preference]

  // The visible label, not the raw preference value: a screen reader should say
  // "Appearance: System", the same word the menu shows.
  const currentLabel =
    THEME_OPTIONS.find((option) => option.value === preference)?.label ?? preference

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
        // The header's own Escape handler closes the mobile sheet. Without this,
        // one press would close both.
        event.stopPropagation()
        setOpen(false)
        // Escape must leave focus somewhere predictable, not on a hidden node.
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

  // Move focus into the menu on open so keyboard users are not stranded.
  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitemradio"]')?.focus()
  }, [open])

  function onMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [],
    )
    if (items.length === 0) return

    event.preventDefault()
    const current = items.indexOf(document.activeElement as HTMLButtonElement)
    const step = event.key === 'ArrowDown' ? 1 : -1
    // Wraps, and treats "focus not yet on an item" as starting before the first.
    items[(current + step + items.length) % items.length]?.focus()
  }

  function choose(next: ThemePreference) {
    setPreference(next)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Appearance: ${currentLabel}`}
        className={cn(
          // 44px where the mobile header puts it next to the menu button, 40px
          // from `lg` up where it sits in a cursor-driven toolbar.
          'grid size-11 place-items-center rounded-lg border transition-colors lg:size-10',
          open
            ? 'border-line-strong bg-surface text-ink'
            : 'border-transparent text-muted hover:border-line-strong hover:bg-surface hover:text-ink',
        )}
      >
        <TriggerIcon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Appearance"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-44 overflow-hidden rounded-xl border border-line-strong bg-surface py-1 shadow-lg shadow-black/[0.08]"
        >
          <p className="eyebrow px-3 pb-1.5 pt-2">Appearance</p>

          {THEME_OPTIONS.map((option) => {
            const Icon = ICONS[option.value]
            const selected = option.value === preference

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => choose(option.value)}
                className={cn(
                  'flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm',
                  selected ? 'font-medium text-ink' : 'text-muted hover:text-ink',
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span className="flex-1">{option.label}</span>
                {selected && (
                  <Check className="size-4 shrink-0 text-accent" strokeWidth={2} aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
