import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Loader2, RefreshCw, RotateCcw } from 'lucide-react'

import type { ToolComponentProps } from '@/tools/registry'
import ToolShell from '@/components/tools/ToolShell'
import { Button } from '@/components/ui/Button'
import { downloadBlob } from '@/lib/download'
import { formatBytes, validateFile } from '@/lib/file'
import PdfDropzone from '@/tools/pdf-compressor/PdfDropzone'
import ModeSelector from '@/tools/pdf-compressor/ModeSelector'
import PdfResultLedger from '@/tools/pdf-compressor/PdfResultLedger'
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_LABEL,
  ACCEPTED_MIME_TYPES,
  DEFAULT_QUALITY,
  DEFAULT_SCALE,
  MAX_BYTES,
  PdfCompressionError,
  compressPdf,
  inspectPdf,
} from '@/tools/pdf-compressor/compressPdf'
import type { CompressionMode, PdfCompressionResult } from '@/tools/pdf-compressor/types'
import { HELP, FAQ } from '@/tools/pdf-compressor/content'

const VALIDATION_RULES = {
  acceptedMimeTypes: ACCEPTED_MIME_TYPES,
  acceptedExtensions: ACCEPTED_EXTENSIONS,
  maxBytes: MAX_BYTES,
  acceptedLabel: ACCEPTED_LABEL,
}

interface Progress {
  done: number
  total: number
}

export default function PdfCompressor({ tool }: ToolComponentProps) {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [mode, setMode] = useState<CompressionMode>('lossless')
  const [quality, setQuality] = useState(DEFAULT_QUALITY)
  /** Quality that produced the result currently on screen. */
  const [appliedQuality, setAppliedQuality] = useState(DEFAULT_QUALITY)
  const [result, setResult] = useState<PdfCompressionResult | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [busy, setBusy] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)
  const [processError, setProcessError] = useState<string | null>(null)

  // Discards results from a run that a newer run has already superseded.
  const runId = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const cancelActiveRun = useCallback(() => {
    runId.current += 1
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  // A page teardown mid-render must not leave the parser working on a document
  // nobody is waiting for.
  useEffect(() => cancelActiveRun, [cancelActiveRun])

  const run = useCallback(
    async (target: File, targetMode: CompressionMode, targetQuality: number) => {
      cancelActiveRun()
      const id = runId.current
      const controller = new AbortController()
      abortRef.current = controller

      setBusy(true)
      setProcessError(null)
      setProgress(null)

      try {
        const next = await compressPdf(
          target,
          {
            mode: targetMode,
            quality: targetQuality,
            scale: DEFAULT_SCALE,
            signal: controller.signal,
            onProgress: (done, total) => {
              if (id === runId.current) setProgress({ done, total })
            },
          },
        )

        if (id !== runId.current) return
        setResult(next)
        setAppliedQuality(targetQuality)
        if (next.pageCount > 0) setPageCount(next.pageCount)
      } catch (error) {
        if (id !== runId.current) return
        setResult(null)
        setProcessError(
          error instanceof PdfCompressionError
            ? error.message
            : 'Something went wrong compressing that PDF. Try a different file.',
        )
      } finally {
        if (id === runId.current) {
          setBusy(false)
          setProgress(null)
          abortRef.current = null
        }
      }
    },
    [cancelActiveRun],
  )

  function handleFile(next: File) {
    const validation = validateFile(next, VALIDATION_RULES)

    if (!validation.ok) {
      setInputError(validation.message)
      return
    }

    setInputError(null)
    setProcessError(null)
    setResult(null)
    setPageCount(null)
    setMode('lossless')
    setQuality(DEFAULT_QUALITY)
    setFile(next)

    // The page count is a nicety for the readout, so a failure here is ignored
    // and never blocks the compression that follows.
    void inspectPdf(next).then((inspection) => {
      if (inspection && inspection.pageCount > 0) setPageCount(inspection.pageCount)
    })

    void run(next, 'lossless', DEFAULT_QUALITY)
  }

  function changeMode(next: CompressionMode) {
    setMode(next)
    if (file) void run(file, next, quality)
  }

  function reset() {
    cancelActiveRun()
    setFile(null)
    setPageCount(null)
    setResult(null)
    setProgress(null)
    setBusy(false)
    setInputError(null)
    setProcessError(null)
    setMode('lossless')
    setQuality(DEFAULT_QUALITY)
    setAppliedQuality(DEFAULT_QUALITY)
  }

  // Rasterising a long document is expensive, so a quality change waits for an
  // explicit press rather than re-running on every slider movement.
  const qualityStale = mode === 'rasterise' && quality !== appliedQuality && !busy

  return (
    <ToolShell tool={tool} help={HELP} faq={FAQ}>
      <div aria-live="polite" className="sr-only">
        {busy
          ? progress
            ? `Compressing page ${progress.done} of ${progress.total}`
            : 'Compressing PDF'
          : processError
            ? processError
            : result
              ? result.didHelp
                ? `Compressed to ${Math.round(result.reductionPercent)} percent smaller`
                : 'The compressed file is not smaller than the original'
              : ''}
      </div>

      {!file ? (
        <PdfDropzone onFile={handleFile} error={inputError} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="min-w-0 rounded-xl border border-line bg-surface p-5 sm:p-6">
            <p className="eyebrow">Selected file</p>
            <p className="mt-2 truncate font-mono text-sm text-ink" title={file.name}>
              {file.name}
            </p>
            <p className="mt-1 text-sm text-muted">
              {formatBytes(file.size)}
              {pageCount !== null && ` · ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}`}
            </p>

            <div className="mt-6 border-t border-line pt-6">
              <ModeSelector
                mode={mode}
                onModeChange={changeMode}
                quality={quality}
                onQualityChange={setQuality}
                disabled={busy}
              />
            </div>

            {qualityStale && (
              <Button variant="secondary" className="mt-4 w-full" onClick={() => void run(file, mode, quality)}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Re-compress at {Math.round(quality * 100)}%
              </Button>
            )}
          </div>

          <div className="min-w-0 rounded-xl border border-line bg-surface p-5 sm:p-6">
            {processError ? (
              <div>
                <h2 className="text-base font-semibold text-ink">That didn't work</h2>
                <p className="mt-2 text-sm leading-relaxed text-danger">{processError}</p>
                <Button variant="secondary" className="mt-5 w-full" onClick={reset}>
                  Choose another PDF
                </Button>
              </div>
            ) : (
              <>
                {result && !busy ? (
                  <PdfResultLedger result={result} filename={result.filename} busy={busy} />
                ) : (
                  <div className="flex items-center gap-3 py-6 text-sm text-muted">
                    <Loader2 className="size-4 animate-spin text-accent" aria-hidden="true" />
                    {progress
                      ? `Rendering page ${progress.done} of ${progress.total}…`
                      : 'Compressing…'}
                  </div>
                )}

                <div className="mt-6 space-y-2.5">
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={!result || busy}
                    onClick={() => {
                      if (result) downloadBlob(result.blob, result.filename)
                    }}
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Download className="size-4" aria-hidden="true" />
                    )}
                    {busy ? 'Working…' : 'Download compressed PDF'}
                  </Button>

                  <Button variant="secondary" className="w-full" onClick={reset}>
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Compress another PDF
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </ToolShell>
  )
}
