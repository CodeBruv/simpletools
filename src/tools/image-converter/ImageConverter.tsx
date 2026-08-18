import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Loader2, RotateCcw } from 'lucide-react'

import ToolShell from '@/components/tools/ToolShell'
import { Button } from '@/components/ui/Button'
import { downloadBlob } from '@/lib/download'
import { formatBytes, validateFile } from '@/lib/file'
import ConverterDropzone from '@/tools/image-converter/ConverterDropzone'
import { FAQ, HELP } from '@/tools/image-converter/content'
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_LABEL,
  ACCEPTED_MIME_TYPES,
  IMAGE_FORMATS,
  ImageConversionError,
  MAX_BYTES,
  convertImage,
  defaultOutputFor,
  resolveInputFormat,
} from '@/tools/image-converter/convertImage'
import type {
  ConversionResult,
  SupportedImageMime,
} from '@/tools/image-converter/convertImage'
import type { ToolComponentProps } from '@/tools/registry'

const VALIDATION_RULES = {
  acceptedMimeTypes: ACCEPTED_MIME_TYPES,
  acceptedExtensions: ACCEPTED_EXTENSIONS,
  maxBytes: MAX_BYTES,
  acceptedLabel: ACCEPTED_LABEL,
}

export default function ImageConverter({ tool }: ToolComponentProps) {
  const [file, setFile] = useState<File | null>(null)
  const [outputMime, setOutputMime] = useState<SupportedImageMime>('image/png')
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)
  const [processError, setProcessError] = useState<string | null>(null)
  const runId = useRef(0)

  const runConversion = useCallback(async (target: File, targetMime: SupportedImageMime) => {
    const id = ++runId.current
    setBusy(true)
    setProcessError(null)

    try {
      const next = await convertImage(target, targetMime)
      if (id !== runId.current) return
      setResult(next)
    } catch (error) {
      if (id !== runId.current) return
      setResult(null)
      setProcessError(
        error instanceof ImageConversionError
          ? error.message
          : 'Something went wrong converting that image. Try a different file.',
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

    const inputFormat = resolveInputFormat(next)
    if (!inputFormat) {
      setInputError(`Choose a ${ACCEPTED_LABEL} image.`)
      return
    }

    const nextOutput = defaultOutputFor(inputFormat).mimeType
    setInputError(null)
    setProcessError(null)
    setResult(null)
    setFile(next)
    setOutputMime(nextOutput)
    void runConversion(next, nextOutput)
  }

  function reset() {
    runId.current += 1
    setFile(null)
    setResult(null)
    setBusy(false)
    setInputError(null)
    setProcessError(null)
    setOutputMime('image/png')
  }

  useEffect(() => () => {
    runId.current += 1
  }, [])

  return (
    <ToolShell tool={tool} help={HELP} faq={FAQ}>
      <div aria-live="polite" className="sr-only">
        {busy
          ? 'Converting image'
          : result
            ? `Image converted to ${result.outputFormat.label}`
            : processError ?? ''}
      </div>

      {!file ? (
        <ConverterDropzone onFile={handleFile} error={inputError} />
      ) : (
        <div className="mx-auto max-w-2xl rounded-xl border border-line bg-surface p-5 sm:p-6">
          <p className="truncate font-mono text-[13px] text-muted" title={file.name}>
            {file.name}
          </p>

          <div className="mt-5">
            <label htmlFor="converter-output" className="text-sm font-medium text-ink">
              Convert to
            </label>
            <select
              id="converter-output"
              value={outputMime}
              disabled={busy}
              onChange={(event) => {
                setOutputMime(event.target.value as SupportedImageMime)
                setResult(null)
                setProcessError(null)
              }}
              className="mt-2 h-11 w-full rounded-lg border border-line-strong bg-paper px-3 text-sm text-ink focus:border-accent focus:outline-none"
            >
              {IMAGE_FORMATS.map((format) => (
                <option key={format.id} value={format.mimeType}>
                  {format.label}
                </option>
              ))}
            </select>
            {outputMime === 'image/jpeg' && (
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                JPG has no transparency. Transparent areas will use a white background.
              </p>
            )}
          </div>

          {processError ? (
            <div role="alert" className="mt-5 rounded-lg border border-danger/30 bg-danger-soft p-4">
              <h2 className="text-sm font-semibold text-ink">That didn't work</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-danger">{processError}</p>
            </div>
          ) : result ? (
            <div className="mt-5 border-t border-line pt-5">
              <h2 className="text-base font-semibold text-ink">Ready to download</h2>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] sm:grid-cols-3">
                <Stat label="Input" value={result.inputFormat.label} />
                <Stat label="Output" value={result.outputFormat.label} />
                <Stat label="Dimensions" value={`${result.width} × ${result.height} px`} />
                <Stat label="Original size" value={formatBytes(result.originalBytes)} />
                <Stat label="Output size" value={formatBytes(result.convertedBytes)} />
                <Stat
                  label="Transparency"
                  value={result.outputFormat.supportsTransparency ? 'Preserved' : 'White background'}
                />
              </dl>
              <p className="mt-4 truncate font-mono text-[13px] text-muted" title={result.filename}>
                {result.filename}
              </p>
            </div>
          ) : busy ? (
            <div className="mt-5 flex items-center gap-3 border-t border-line py-7 text-sm text-muted">
              <Loader2 className="size-4 animate-spin text-accent" aria-hidden="true" />
              Converting…
            </div>
          ) : null}

          <div className="mt-6 space-y-2.5 border-t border-line pt-6">
            {result ? (
              <Button
                size="lg"
                className="w-full"
                disabled={busy}
                onClick={() => downloadBlob(result.blob, result.filename)}
              >
                <Download className="size-4" aria-hidden="true" />
                Download {result.outputFormat.label}
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full"
                disabled={busy}
                onClick={() => void runConversion(file, outputMime)}
              >
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {busy ? 'Converting…' : 'Convert image'}
              </Button>
            )}

            <Button variant="secondary" className="w-full" onClick={reset}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Convert another image
            </Button>
          </div>
        </div>
      )}
    </ToolShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-ink">{value}</dd>
    </div>
  )
}
