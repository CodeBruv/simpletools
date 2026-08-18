import { useRef, useState } from 'react'
import { Images, Upload } from 'lucide-react'

import PrivacyNote from '@/components/tools/PrivacyNote'
import { formatBytes } from '@/lib/file'
import { cn } from '@/lib/utils'
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_LABEL,
  ACCEPTED_MIME_TYPES,
  MAX_BYTES,
} from '@/tools/image-converter/convertImage'

interface ConverterDropzoneProps {
  onFile: (file: File) => void
  error?: string | null
  disabled?: boolean
}

export default function ConverterDropzone({
  onFile,
  error,
  disabled = false,
}: ConverterDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const depth = useRef(0)

  function resetDrag() {
    depth.current = 0
    setDragging(false)
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    resetDrag()
    if (disabled) return

    const file = event.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div>
      <div
        onDragEnter={(event) => {
          event.preventDefault()
          depth.current += 1
          if (!disabled) setDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault()
          depth.current -= 1
          if (depth.current <= 0) resetDrag()
        }}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-xl border-2 border-dashed px-5 py-10 text-center transition-colors duration-150 sm:px-8 sm:py-16',
          dragging ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface',
          error && !dragging && 'border-danger/50 bg-danger-soft',
          disabled && 'opacity-60',
        )}
      >
        <span
          className={cn(
            'mx-auto grid size-12 place-items-center rounded-xl',
            dragging ? 'bg-accent text-on-accent' : 'bg-accent-soft text-accent',
          )}
        >
          {dragging ? (
            <Upload className="size-6" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Images className="size-6" strokeWidth={1.75} aria-hidden="true" />
          )}
        </span>

        <p className="mt-4 text-base font-medium text-ink">
          {dragging ? 'Drop to convert' : 'Drop an image here'}
        </p>
        <p className="mt-1 text-sm text-muted">
          {ACCEPTED_LABEL}, up to {formatBytes(MAX_BYTES, 0)}
        </p>

        <div className="mt-5">
          <label
            className={cn(
              'inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-accent px-5',
              'text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover',
              'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent',
              disabled && 'pointer-events-none',
            )}
          >
            Choose an image
            <input
              type="file"
              accept={[...ACCEPTED_MIME_TYPES, ...ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`)].join(',')}
              disabled={disabled}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) onFile(file)
              }}
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mx-auto mt-5 max-w-sm text-sm font-medium leading-relaxed text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="mt-4">
        <PrivacyNote>
          Your image stays on your device. It is decoded and converted locally in your browser, and
          is never uploaded to a server.
        </PrivacyNote>
      </div>
    </div>
  )
}
