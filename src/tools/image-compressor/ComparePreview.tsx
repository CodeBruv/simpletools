import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import type { CompressionResult } from '@/tools/image-compressor/types'

/**
 * Creates an object URL for a Blob and revokes it when the Blob changes or the
 * component unmounts. Keeping this in one hook means no caller can leak a URL.
 */
function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }

    const next = URL.createObjectURL(blob)
    setUrl(next)

    return () => {
      URL.revokeObjectURL(next)
      setUrl(null)
    }
  }, [blob])

  return url
}

export default function ComparePreview({
  file,
  result,
  failed = false,
}: {
  file: File
  result: CompressionResult | null
  /** True once compression has failed, so the empty panel stops claiming to be working. */
  failed?: boolean
}) {
  const originalUrl = useObjectUrl(file)
  const compressedUrl = useObjectUrl(result?.blob)

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      <Panel label="Original" url={originalUrl} />
      <Panel
        label="Compressed"
        url={compressedUrl}
        tone="accent"
        placeholder={failed ? 'Not available' : 'Rendering'}
      />
    </div>
  )
}

function Panel({
  label,
  url,
  tone = 'neutral',
  placeholder = 'Rendering',
}: {
  label: string
  url: string | null
  tone?: 'neutral' | 'accent'
  placeholder?: string
}) {
  return (
    <figure className="min-w-0">
      <figcaption className={cn('eyebrow mb-2 block', tone === 'accent' && 'text-accent')}>
        {label}
      </figcaption>

      <div
        className={cn(
          'flex aspect-4/3 items-center justify-center overflow-hidden rounded-xl border bg-surface',
          tone === 'accent' ? 'border-accent/30' : 'border-line',
          // A checker pattern makes transparency obvious rather than reading
          // as a solid background. Both squares are theme tokens, so the
          // pattern darkens with the page instead of glaring in dark mode.
          'checkerboard',
        )}
      >
        {url ? (
          <img
            src={url}
            alt={`${label} image preview`}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="eyebrow">{placeholder}</span>
        )}
      </div>
    </figure>
  )
}
