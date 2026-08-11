import { useRef, useState } from 'react'
import { FilePlus2, Upload } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/file'
import PrivacyNote from '@/components/tools/PrivacyNote'
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_LABEL,
  ACCEPTED_MIME_TYPES,
  MAX_BYTES,
} from '@/tools/pdf-compressor/compressPdf'

interface PdfDropzoneProps {
  onFile: (file: File) => void
  /** Rendered inside the zone when the last attempt failed. */
  error?: string | null
  disabled?: boolean
}

export default function PdfDropzone({ onFile, error, disabled = false }: PdfDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // dragenter/dragleave fire for child elements too, so count depth instead of
  // clearing the state on the first leave.
  const depth = useRef(0)

  function reset() {
    depth.current = 0
    setDragging(false)
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    reset()
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
        onDragOver={(event) => {
          event.preventDefault()
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          depth.current -= 1
          if (depth.current <= 0) reset()
        }}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-colors duration-150',
          'px-5 py-10 text-center sm:px-8 sm:py-16',
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
            <FilePlus2 className="size-6" strokeWidth={1.75} aria-hidden="true" />
          )}
        </span>

        <p className="mt-4 text-base font-medium text-ink">
          {dragging ? 'Drop to compress' : 'Drop a PDF here'}
        </p>

        <p className="mt-1 text-sm text-muted">
          {ACCEPTED_LABEL} files, up to {formatBytes(MAX_BYTES, 0)}
        </p>

        <div className="mt-5">
          <label
            className={cn(
              'inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-accent px-5',
              'text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover',
              'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent',
              disabled && 'pointer-events-none',
            )}
          >
            Choose a PDF
            <input
              ref={inputRef}
              type="file"
              // Some Android file pickers grey out valid files when the accept
              // list is MIME types alone, so offer extensions as well.
              accept={[...ACCEPTED_MIME_TYPES, ...ACCEPTED_EXTENSIONS.map((e) => `.${e}`)].join(',')}
              disabled={disabled}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                // Clear the value so picking the same file again re-triggers change.
                event.target.value = ''
                if (file) onFile(file)
              }}
            />
          </label>
        </div>

        {error && (
          <p
            role="alert"
            className="mx-auto mt-5 max-w-sm text-sm font-medium leading-relaxed text-danger"
          >
            {error}
          </p>
        )}
      </div>

      <div className="mt-4">
        <PrivacyNote>
          Your PDF stays on your device. It is processed locally in your browser, and is never
          uploaded to a server.
        </PrivacyNote>
      </div>
    </div>
  )
}
