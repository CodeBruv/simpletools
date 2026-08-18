import { useRef, useState } from 'react'
import { FilePlus2, Upload } from 'lucide-react'

import PrivacyNote from '@/components/tools/PrivacyNote'
import { formatBytes } from '@/lib/file'
import { cn } from '@/lib/utils'
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  MAX_TOTAL_BYTES,
} from '@/tools/pdf-merger/mergePdfs'

interface MergerDropzoneProps {
  onFiles: (files: File[]) => void
  error?: string | null
  disabled?: boolean
  compact?: boolean
}

export default function MergerDropzone({
  onFiles,
  error,
  disabled = false,
  compact = false,
}: MergerDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const depth = useRef(0)

  function resetDrag() {
    depth.current = 0
    setDragging(false)
  }

  function submit(files: FileList | null) {
    if (!disabled && files?.length) onFiles(Array.from(files))
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
        onDrop={(event) => {
          event.preventDefault()
          resetDrag()
          submit(event.dataTransfer.files)
        }}
        className={cn(
          'relative rounded-xl border-2 border-dashed text-center transition-colors duration-150',
          compact ? 'px-4 py-5' : 'px-5 py-10 sm:px-8 sm:py-16',
          dragging ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface',
          error && !dragging && 'border-danger/50 bg-danger-soft',
          disabled && 'opacity-60',
        )}
      >
        {!compact && (
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
        )}

        <p className={cn('font-medium text-ink', compact ? 'text-sm' : 'mt-4 text-base')}>
          {dragging ? 'Drop PDFs to add them' : compact ? 'Add more PDFs' : 'Drop PDF files here'}
        </p>
        <p className="mt-1 text-sm text-muted">
          Selected files can total up to {formatBytes(MAX_TOTAL_BYTES, 0)}
        </p>

        <div className="mt-4">
          <label
            className={cn(
              'inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-accent px-5',
              'text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover',
              'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent',
              disabled && 'pointer-events-none',
            )}
          >
            {compact ? 'Choose more PDFs' : 'Choose PDF files'}
            <input
              type="file"
              multiple
              accept={[...ACCEPTED_MIME_TYPES, ...ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`)].join(',')}
              disabled={disabled}
              className="sr-only"
              onChange={(event) => {
                submit(event.target.files)
                event.target.value = ''
              }}
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mx-auto mt-4 max-w-md text-sm font-medium leading-relaxed text-danger">
            {error}
          </p>
        )}
      </div>

      {!compact && (
        <div className="mt-4">
          <PrivacyNote>
            Your PDFs stay on your device. They are combined locally in your browser and are never
            uploaded to a server.
          </PrivacyNote>
        </div>
      )}
    </div>
  )
}
