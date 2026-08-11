import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Loader2, RotateCcw } from 'lucide-react'

import type { ToolComponentProps } from '@/tools/registry'
import ToolShell from '@/components/tools/ToolShell'
import { Button } from '@/components/ui/Button'
import { downloadBlob } from '@/lib/download'
import { validateFile } from '@/lib/file'
import Dropzone from '@/tools/image-compressor/Dropzone'
import QualitySlider from '@/tools/image-compressor/QualitySlider'
import ResultLedger from '@/tools/image-compressor/ResultLedger'
import ComparePreview from '@/tools/image-compressor/ComparePreview'
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_LABEL,
  ACCEPTED_MIME_TYPES,
  DEFAULT_QUALITY,
  ImageCompressionError,
  MAX_BYTES,
  compressImage,
} from '@/tools/image-compressor/compressImage'
import type { CompressionResult } from '@/tools/image-compressor/types'
import { HELP, FAQ } from '@/tools/image-compressor/content'

const VALIDATION_RULES = {
  acceptedMimeTypes: ACCEPTED_MIME_TYPES,
  acceptedExtensions: ACCEPTED_EXTENSIONS,
  maxBytes: MAX_BYTES,
  acceptedLabel: ACCEPTED_LABEL,
}

/** Long enough that dragging the slider doesn't queue an encode per pixel. */
const RECOMPRESS_DEBOUNCE_MS = 220

export default function ImageCompressor({ tool }: ToolComponentProps) {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState(DEFAULT_QUALITY)
  const [result, setResult] = useState<CompressionResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)
  const [processError, setProcessError] = useState<string | null>(null)

  // Discards results from a run that a newer run has already superseded.
  const runId = useRef(0)

  const compress = useCallback(async (target: File, targetQuality: number) => {
    const id = ++runId.current
    setBusy(true)
    setProcessError(null)

    try {
      const next = await compressImage(target, { quality: targetQuality, format: 'auto' })
      if (id !== runId.current) return
      setResult(next)
    } catch (error) {
      if (id !== runId.current) return
      setResult(null)
      setProcessError(
        error instanceof ImageCompressionError
          ? error.message
          : "Something went wrong compressing that image. Try a different file.",
      )
    } finally {
      if (id === runId.current) setBusy(false)
    }
  }, [])

  function handleFile(next: File) {
    const validation = validateFile(next, VALIDATION_RULES)

    if (!validation.ok) {
      setInputError(validation.message)
      return
    }

    setInputError(null)
    setProcessError(null)
    setResult(null)
    setQuality(DEFAULT_QUALITY)
    setFile(next)
    void compress(next, DEFAULT_QUALITY)
  }

  function reset() {
    runId.current += 1
    setFile(null)
    setResult(null)
    setBusy(false)
    setInputError(null)
    setProcessError(null)
    setQuality(DEFAULT_QUALITY)
  }

  // Re-encode when the quality changes, debounced so a slider drag results in
  // one encode rather than dozens.
  const isFirstQualityRun = useRef(true)
  useEffect(() => {
    if (!file) return
    if (isFirstQualityRun.current) {
      isFirstQualityRun.current = false
      return
    }

    const timer = setTimeout(() => void compress(file, quality), RECOMPRESS_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [file, quality, compress])

  useEffect(() => {
    if (!file) isFirstQualityRun.current = true
  }, [file])

  return (
    <ToolShell tool={tool} help={HELP} faq={FAQ}>
      <div aria-live="polite" className="sr-only">
        {busy
          ? 'Compressing image'
          : result
            ? `Compressed to ${Math.round(result.reductionPercent)} percent smaller`
            : ''}
      </div>

      {!file ? (
        <Dropzone onFile={handleFile} error={inputError} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <ComparePreview file={file} result={result} failed={Boolean(processError)} />

          {/* min-w-0 stops a long filename, which is set to not wrap, from
              widening the grid track and forcing the page to scroll sideways. */}
          <div className="min-w-0 rounded-xl border border-line bg-surface p-5 sm:p-6">
            {processError ? (
              <div>
                <h2 className="text-base font-semibold text-ink">That didn't work</h2>
                <p className="mt-2 text-sm leading-relaxed text-danger">{processError}</p>
                <Button variant="secondary" className="mt-5 w-full" onClick={reset}>
                  Choose another image
                </Button>
              </div>
            ) : (
              <>
                {result ? (
                  <ResultLedger result={result} filename={file.name} busy={busy} />
                ) : (
                  <div className="flex items-center gap-3 py-6 text-sm text-muted">
                    <Loader2 className="size-4 animate-spin text-accent" aria-hidden="true" />
                    Compressing…
                  </div>
                )}

                <div className="mt-7 border-t border-line pt-6">
                  <QualitySlider value={quality} onChange={setQuality} disabled={!result && busy} />
                </div>

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
                    {busy ? 'Compressing…' : 'Download compressed image'}
                  </Button>

                  <Button variant="secondary" className="w-full" onClick={reset}>
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Compress another image
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
