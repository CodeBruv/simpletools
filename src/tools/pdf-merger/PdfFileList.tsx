import { ArrowDown, ArrowUp, FileText, Trash2 } from 'lucide-react'

import { formatBytes } from '@/lib/file'

export interface SelectedPdf {
  id: number
  file: File
  pageCount: number
}

interface PdfFileListProps {
  files: readonly SelectedPdf[]
  disabled: boolean
  onMove: (index: number, direction: -1 | 1) => void
  onRemove: (index: number) => void
}

export default function PdfFileList({ files, disabled, onMove, onRemove }: PdfFileListProps) {
  return (
    <ol className="divide-y divide-line border-y border-line" aria-label="PDF merge order">
      {files.map((item, index) => (
        <li key={item.id} className="flex min-w-0 items-center gap-3 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
            <FileText className="size-4" aria-hidden="true" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink" title={item.file.name}>
              {index + 1}. {item.file.name}
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              {formatBytes(item.file.size)} · {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="grid size-11 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-35"
              disabled={disabled || index === 0}
              onClick={() => onMove(index, -1)}
              aria-label={`Move ${item.file.name} up`}
              title="Move up"
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-35"
              disabled={disabled || index === files.length - 1}
              onClick={() => onMove(index, 1)}
              aria-label={`Move ${item.file.name} down`}
              title="Move down"
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-lg text-muted transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-35"
              disabled={disabled}
              onClick={() => onRemove(index)}
              aria-label={`Remove ${item.file.name}`}
              title="Remove"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </span>
        </li>
      ))}
    </ol>
  )
}
