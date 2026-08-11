import { Hammer } from 'lucide-react'

import type { Tool } from '@/tools/registry'
import { ButtonLink } from '@/components/ui/Button'
import { getTool } from '@/tools/registry'
import { toolPath } from '@/lib/paths'

/**
 * Honest placeholder for a registered-but-unbuilt tool. It deliberately shows
 * no controls: a disabled mock would imply the tool exists.
 */
export default function ComingSoon({ tool }: { tool: Tool }) {
  const imageCompressor = getTool('image-compressor')

  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-surface/70 px-6 py-12 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-lg bg-paper text-muted">
        <Hammer className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>

      <h2 className="mt-4 text-base font-semibold text-ink">This one isn't built yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
        {tool.name} is next in line. When it lands it will work the same way as the rest of
        SimpleTools: in your browser, with nothing to sign up for.
      </p>

      {imageCompressor && imageCompressor.status === 'available' && (
        <div className="mt-6">
          <ButtonLink to={toolPath(imageCompressor.slug)} variant="secondary">
            Try the {imageCompressor.name}
          </ButtonLink>
        </div>
      )}
    </div>
  )
}
