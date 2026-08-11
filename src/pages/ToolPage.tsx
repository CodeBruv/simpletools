import { Suspense } from 'react'
import { useParams } from 'react-router-dom'

import type { Tool } from '@/tools/registry'
import { getTool } from '@/tools/registry'
import ToolShell from '@/components/tools/ToolShell'
import ComingSoon from '@/components/tools/ComingSoon'
import NotFound from '@/pages/NotFound'
import { usePageMeta } from '@/lib/seo'
import { toolPath } from '@/lib/paths'

function ToolLoading() {
  return (
    <div
      className="rounded-xl border border-line bg-surface px-6 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="eyebrow">Loading tool</span>
    </div>
  )
}

export default function ToolPage() {
  const { slug = '' } = useParams()
  const tool = getTool(slug)

  // An unknown slug is a genuine 404. Rendering NotFound rather than setting
  // metadata here keeps a made-up slug from ever emitting a canonical URL.
  if (!tool) return <NotFound />

  return <ToolView tool={tool} />
}

function ToolView({ tool }: { tool: Tool }) {
  // Metadata comes from the registry so a tool never has to remember to set it.
  usePageMeta({
    title: tool.seo.title,
    description: tool.seo.description,
    path: toolPath(tool.slug),
  })

  if (!tool.component) {
    return (
      <ToolShell tool={tool}>
        <ComingSoon tool={tool} />
      </ToolShell>
    )
  }

  const ToolComponent = tool.component

  return (
    <Suspense fallback={<ToolLoading />}>
      <ToolComponent tool={tool} />
    </Suspense>
  )
}
