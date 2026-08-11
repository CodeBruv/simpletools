import type { Tool } from '@/tools/registry'
import ToolCard from '@/components/tools/ToolCard'
import { cn } from '@/lib/utils'

interface ToolGridProps {
  tools: Tool[]
  /** Slug rendered with extra visual weight, if present in `tools`. */
  emphasiseSlug?: string
  className?: string
}

export default function ToolGrid({ tools, emphasiseSlug, className }: ToolGridProps) {
  if (tools.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line-strong px-5 py-8 text-center text-sm text-muted">
        No tools here yet.
      </p>
    )
  }

  return (
    <ul className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {tools.map((tool) => {
        const emphasis = tool.slug === emphasiseSlug

        return (
          <li key={tool.slug} className={cn(emphasis && 'sm:col-span-2 lg:col-span-1')}>
            <ToolCard tool={tool} emphasis={emphasis} />
          </li>
        )
      })}
    </ul>
  )
}
