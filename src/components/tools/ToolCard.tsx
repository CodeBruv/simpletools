import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import type { Tool } from '@/tools/registry'
import { CATEGORIES } from '@/data/categories'
import { toolPath } from '@/lib/paths'
import { cn } from '@/lib/utils'

interface ToolCardProps {
  tool: Tool
  /** Gives the card more presence — used for the lead tool on the homepage. */
  emphasis?: boolean
}

export default function ToolCard({ tool, emphasis = false }: ToolCardProps) {
  const Icon = tool.icon
  const category = CATEGORIES.find((c) => c.id === tool.category)
  const isAvailable = tool.status === 'available'

  return (
    <Link
      to={toolPath(tool.slug)}
      className={cn(
        'group relative flex flex-col rounded-xl border bg-surface p-5 transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/[0.05]',
        emphasis ? 'border-accent/35 sm:p-6' : 'border-line',
        !isAvailable && 'bg-surface/60',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'grid place-items-center rounded-lg',
            emphasis ? 'size-11 bg-accent text-on-accent' : 'size-10 bg-accent-soft text-accent',
            !isAvailable && 'bg-paper text-faint',
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>

        {isAvailable ? (
          emphasis && <span className="eyebrow text-accent">Ready to use</span>
        ) : (
          <span className="eyebrow rounded-full border border-line px-2 py-1">Coming soon</span>
        )}
      </div>

      <h3
        className={cn(
          'mt-4 font-semibold text-ink',
          emphasis ? 'text-lg' : 'text-[15px]',
          !isAvailable && 'text-muted',
        )}
      >
        {tool.name}
      </h3>

      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{tool.description}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        {category && <span className="eyebrow">{category.name}</span>}
        {isAvailable && (
          <span
            aria-hidden="true"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-accent"
          >
            Open
            <ArrowRight
              className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </span>
        )}
      </div>
    </Link>
  )
}
