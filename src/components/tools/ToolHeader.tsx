import type { Tool } from '@/tools/registry'
import { getToolTrail } from '@/tools/registry'
import Breadcrumb from '@/components/ui/Breadcrumb'

/**
 * The top of every tool page: breadcrumb, icon, the page's single H1, and the
 * one-line description. Tools never render their own H1.
 *
 * The trail comes from the registry rather than being assembled here, so the
 * category a tool belongs to is stated in exactly one place.
 */
export default function ToolHeader({ tool }: { tool: Tool }) {
  const Icon = tool.icon

  return (
    <div>
      <Breadcrumb items={getToolTrail(tool.slug)} />

      <div className="mt-6 flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-on-accent">
          <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-3xl">
            {tool.name}
          </h1>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{tool.description}</p>
        </div>
      </div>
    </div>
  )
}
