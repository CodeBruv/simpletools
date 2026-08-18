import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, FilePlus2, Loader2, RotateCcw } from 'lucide-react'

import ToolShell from '@/components/tools/ToolShell'
import { Button } from '@/components/ui/Button'
import { downloadBlob } from '@/lib/download'
import { formatBytes } from '@/lib/file'
import type { ToolComponentProps } from '@/tools/registry'
import { FAQ, HELP } from '@/tools/pdf-merger/content'
import MergerDropzone from '@/tools/pdf-merger/MergerDropzone'
import PdfFileList, { type SelectedPdf } from '@/tools/pdf-merger/PdfFileList'
import {
  MAX_TOTAL_BYTES,
  PdfMergeError,
  inspectPdfFile,
  mergePdfs,
} from '@/tools/pdf-merger/mergePdfs'

interface Progress {
  done: number
  total: number
}

let nextFileId = 1

export default function PdfMerger({ tool }: ToolComponentProps) {
  const [files, setFiles] = useState<SelectedPdf[]>([])
  const [inputError, setInputError] = useState<string | null>(null)
  const [processError, setProcessError] = useState<string | null>(null)
  const [result, setResult] = useState<Awaited<ReturnType<typeof mergePdfs>> | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [busy, setBusy] = useState(false)
  const runId = useRef(0)

  const cancelActiveRun = useCallback(() => {
    runId.current += 1
  }, [])

  useEffect(() => cancelActiveRun, [cancelActiveRun])

  async function addFiles(nextFiles: File[]) {
    if (!nextFiles.length || busy) return

    setInputError(null)
    setProcessError(null)
    setResult(null)

    const existing = new Set(
      files.map((item) => `${item.file.name}:${item.file.size}:${item.file.lastModified}`),
    )
    const candidates = nextFiles.filter(
      (file) => !existing.has(`${file.name}:${file.size}:${file.lastModified}`),
    )
    const selectedBytes = files.reduce((total, item) => total + item.file.size, 0)
    const candidateBytes = candidates.reduce((total, file) => total + file.size, 0)

    if (selectedBytes + candidateBytes > MAX_TOTAL_BYTES) {
      setInputError('Those files would exceed the 50 MB total limit. Remove a file or choose fewer files.')
      return
    }

    const added: SelectedPdf[] = []
    for (const file of candidates) {
      try {
        const inspection = await inspectPdfFile(file)
        added.push({ id: nextFileId++, file, pageCount: inspection.pageCount })
      } catch (error) {
        setInputError(error instanceof PdfMergeError ? error.message : `${file.name} could not be added.`)
        break
      }
    }

    if (added.length) setFiles((current) => [...current, ...added])
  }

  function moveFile(index: number, direction: -1 | 1) {
    setFiles((current) => {
      const target = index + direction
      const item = current[index]
      const targetItem = current[target]
      if (!item || !targetItem) return current

      const next = [...current]
      next[index] = targetItem
      next[target] = item
      return next
    })
    setResult(null)
    setProcessError(null)
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setResult(null)
    setProcessError(null)
    setInputError(null)
  }

  async function mergeSelected() {
    if (files.length < 2 || busy) return

    cancelActiveRun()
    const id = runId.current
    setBusy(true)
    setProcessError(null)
    setResult(null)
    setProgress(null)

    try {
      const next = await mergePdfs(
        files.map((item) => item.file),
        undefined,
        (done, total) => {
          if (id === runId.current) setProgress({ done, total })
        },
      )
      if (id === runId.current) setResult(next)
    } catch (error) {
      if (id === runId.current) {
        setProcessError(
          error instanceof PdfMergeError
            ? error.message
            : "The PDFs couldn't be merged. Try removing one file and adding it again.",
        )
      }
    } finally {
      if (id === runId.current) {
        setBusy(false)
        setProgress(null)
      }
    }
  }

  function reset() {
    cancelActiveRun()
    setFiles([])
    setInputError(null)
    setProcessError(null)
    setResult(null)
    setProgress(null)
    setBusy(false)
  }

  const totalBytes = files.reduce((total, item) => total + item.file.size, 0)
  const totalPages = files.reduce((total, item) => total + item.pageCount, 0)
  const liveMessage = busy
    ? progress
      ? `Merging file ${progress.done} of ${progress.total}`
      : 'Merging PDFs'
    : processError
      ? processError
      : result
        ? `Merged ${result.fileCount} files into ${result.pageCount} pages`
        : ''

  return (
    <ToolShell tool={tool} help={HELP} faq={FAQ}>
      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>

      {files.length === 0 ? (
        <MergerDropzone onFiles={addFiles} error={inputError} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <section className="min-w-0 rounded-xl border border-line bg-surface p-5 sm:p-6 lg:col-start-1 lg:row-start-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Merge order</p>
                <h2 className="mt-2 text-base font-semibold text-ink">{files.length} PDF files</h2>
                <p className="mt-1 text-sm text-muted">
                  {formatBytes(totalBytes)} · {totalPages} {totalPages === 1 ? 'page' : 'pages'}
                </p>
              </div>
              <FilePlus2 className="size-5 shrink-0 text-accent" aria-hidden="true" />
            </div>

            <div className="mt-5">
              <PdfFileList files={files} disabled={busy} onMove={moveFile} onRemove={removeFile} />
            </div>

            <div className="mt-5">
              <MergerDropzone onFiles={addFiles} error={inputError} disabled={busy} compact />
            </div>
          </section>

          <section className="min-w-0 rounded-xl border border-line bg-surface p-5 sm:p-6 lg:col-start-2">
            {processError ? (
              <div>
                <h2 className="text-base font-semibold text-ink">That didn't work</h2>
                <p role="alert" className="mt-2 text-sm leading-relaxed text-danger">
                  {processError}
                </p>
              </div>
            ) : result && !busy ? (
              <div>
                <p className="eyebrow">Merge complete</p>
                <h2 className="mt-2 text-base font-semibold text-ink">Your PDF is ready</h2>
                <p className="mt-2 truncate font-mono text-sm text-ink" title={result.filename}>
                  {result.filename}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatBytes(result.outputBytes)} · {result.pageCount}{' '}
                  {result.pageCount === 1 ? 'page' : 'pages'}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-2 text-sm text-muted">
                {busy && <Loader2 className="size-4 animate-spin text-accent" aria-hidden="true" />}
                {busy
                  ? progress
                    ? `Merging file ${progress.done} of ${progress.total}…`
                    : 'Merging PDFs…'
                  : files.length < 2
                    ? 'Add one more PDF to continue'
                    : 'Ready to merge'}
              </div>
            )}

            <div className="mt-6 space-y-2.5">
              <Button
                size="lg"
                className="w-full"
                disabled={files.length < 2 || busy || Boolean(result)}
                onClick={() => void mergeSelected()}
              >
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {busy ? 'Merging…' : 'Merge PDFs'}
              </Button>

              {result && !busy && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => downloadBlob(result.blob, result.filename)}
                >
                  <Download className="size-4" aria-hidden="true" />
                  Download merged PDF
                </Button>
              )}

              <Button variant="secondary" className="w-full" onClick={reset} disabled={busy}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Merge another set
              </Button>
            </div>
          </section>
        </div>
      )}
    </ToolShell>
  )
}
