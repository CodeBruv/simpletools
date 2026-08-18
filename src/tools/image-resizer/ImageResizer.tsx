import { useMemo, useRef, useState } from 'react'
import { Download, Loader2, RotateCcw } from 'lucide-react'

import ToolShell from '@/components/tools/ToolShell'
import { Button } from '@/components/ui/Button'
import { downloadBlob } from '@/lib/download'
import { formatBytes, validateFile } from '@/lib/file'
import { IMAGE_FORMATS, MAX_BYTES, resolveInputFormat } from '@/tools/image-converter/convertImage'
import type { SupportedImageMime } from '@/tools/image-converter/convertImage'
import { FAQ, HELP } from '@/tools/image-resizer/content'
import ResizerDropzone from '@/tools/image-resizer/ResizerDropzone'
import {
  DEFAULT_QUALITY,
  ImageResizeError,
  calculateResizeDimensions,
  inspectImage,
  resizeImage,
} from '@/tools/image-resizer/resizeImage'
import type {
  InspectedImage,
  ResizeMode,
  ResizeRequest,
  ResizeResult,
} from '@/tools/image-resizer/resizeImage'
import type { ToolComponentProps } from '@/tools/registry'

const VALIDATION_RULES = {
  acceptedMimeTypes: IMAGE_FORMATS.map((format) => format.mimeType),
  acceptedExtensions: IMAGE_FORMATS.flatMap((format) => format.inputExtensions),
  maxBytes: MAX_BYTES,
  acceptedLabel: 'JPG, PNG and WebP',
}

const fieldClass = 'mt-2 h-11 w-full rounded-lg border border-line-strong bg-paper px-3 text-sm text-ink focus:border-accent focus:outline-none'

export default function ImageResizer({ tool }: ToolComponentProps) {
  const [file, setFile] = useState<File | null>(null)
  const [image, setImage] = useState<InspectedImage | null>(null)
  const [mode, setMode] = useState<ResizeMode>('exact')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [percentage, setPercentage] = useState('50')
  const [locked, setLocked] = useState(true)
  const [outputMime, setOutputMime] = useState<SupportedImageMime>('image/jpeg')
  const [quality, setQuality] = useState(DEFAULT_QUALITY)
  const [targetEnabled, setTargetEnabled] = useState(false)
  const [targetKb, setTargetKb] = useState('500')
  const [result, setResult] = useState<ResizeResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)
  const [processError, setProcessError] = useState<string | null>(null)
  const runId = useRef(0)

  const request = useMemo<ResizeRequest>(() => ({
    mode,
    width: width ? Number(width) : undefined,
    height: height ? Number(height) : undefined,
    percentage: percentage ? Number(percentage) : undefined,
    preserveAspectRatio: locked,
  }), [mode, width, height, percentage, locked])

  const preview = useMemo(() => {
    if (!image) return null
    try {
      return { dimensions: calculateResizeDimensions(image, request), error: null }
    } catch (error) {
      return { dimensions: null, error: error instanceof ImageResizeError ? error.message : 'Check the resize values.' }
    }
  }, [image, request])

  async function handleFile(next: File) {
    const validation = validateFile(next, VALIDATION_RULES)
    if (!validation.ok) {
      setInputError(validation.message)
      return
    }
    const inputFormat = resolveInputFormat(next)
    if (!inputFormat) {
      setInputError('Choose a JPG, PNG or WebP image.')
      return
    }

    const id = ++runId.current
    setBusy(true)
    setInputError(null)
    try {
      const inspected = await inspectImage(next)
      if (id !== runId.current) return
      setFile(next)
      setImage(inspected)
      setWidth(String(inspected.width))
      setHeight(String(inspected.height))
      setOutputMime(inspected.inputFormat.mimeType)
      setResult(null)
      setProcessError(null)
    } catch (error) {
      if (id === runId.current) {
        setInputError(error instanceof ImageResizeError ? error.message : "That image couldn't be read.")
      }
    } finally {
      if (id === runId.current) setBusy(false)
    }
  }

  function updateWidth(value: string) {
    setWidth(value)
    if (locked && image && Number(value) > 0) {
      setHeight(String(Math.max(1, Math.round(Number(value) * image.height / image.width))))
    }
    setResult(null)
  }

  function updateHeight(value: string) {
    setHeight(value)
    if (locked && image && Number(value) > 0) {
      setWidth(String(Math.max(1, Math.round(Number(value) * image.width / image.height))))
    }
    setResult(null)
  }

  async function process() {
    if (!file || !preview?.dimensions) return
    const id = ++runId.current
    setBusy(true)
    setProcessError(null)
    setResult(null)
    try {
      const next = await resizeImage(file, {
        dimensions: request,
        outputMimeType: outputMime,
        quality,
        targetBytes: targetEnabled ? Number(targetKb) * 1024 : undefined,
      })
      if (id === runId.current) setResult(next)
    } catch (error) {
      if (id === runId.current) {
        setProcessError(error instanceof ImageResizeError ? error.message : 'Something went wrong resizing that image.')
      }
    } finally {
      if (id === runId.current) setBusy(false)
    }
  }

  function reset() {
    runId.current += 1
    setFile(null)
    setImage(null)
    setMode('exact')
    setWidth('')
    setHeight('')
    setPercentage('50')
    setLocked(true)
    setOutputMime('image/jpeg')
    setQuality(DEFAULT_QUALITY)
    setTargetEnabled(false)
    setTargetKb('500')
    setResult(null)
    setBusy(false)
    setInputError(null)
    setProcessError(null)
  }

  return (
    <ToolShell tool={tool} help={HELP} faq={FAQ}>
      <div aria-live="polite" className="sr-only">
        {busy ? (targetEnabled ? 'Optimizing image' : 'Resizing image') : result ? `Image resized to ${result.width} by ${result.height} pixels` : processError ?? ''}
      </div>

      {!file || !image ? (
        <ResizerDropzone onFile={(next) => void handleFile(next)} error={inputError} />
      ) : (
        <div className="mx-auto max-w-3xl rounded-xl border border-line bg-surface p-5 sm:p-6">
          <div className="min-w-0 border-b border-line pb-5">
            <p className="truncate font-mono text-[13px] text-muted" title={file.name}>{file.name}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-3">
              <Stat label="Original dimensions" value={`${image.width} × ${image.height} px`} />
              <Stat label="Original size" value={formatBytes(file.size)} />
              <Stat label="Format" value={image.inputFormat.label} />
            </dl>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-ink">Resize mode</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {([['exact', 'Exact dimensions'], ['percentage', 'Percentage'], ['fit', 'Fit within']] as const).map(([value, label]) => (
                <label key={value} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-paper px-3 text-sm text-ink">
                  <input type="radio" name="resize-mode" value={value} checked={mode === value} onChange={() => { setMode(value); setResult(null); setProcessError(null) }} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-ink">Dimensions</legend>
            {mode === 'percentage' ? (
              <label className="mt-3 block text-sm text-ink" htmlFor="resize-percentage">Scale percentage
                <input id="resize-percentage" type="number" min="1" step="1" value={percentage} onChange={(event) => { setPercentage(event.target.value); setResult(null) }} className={fieldClass} />
              </label>
            ) : (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-ink" htmlFor="resize-width">{mode === 'fit' ? 'Maximum width' : 'Width'}
                  <input id="resize-width" type="number" min="1" step="1" value={width} onChange={(event) => updateWidth(event.target.value)} className={fieldClass} />
                </label>
                <label className="text-sm text-ink" htmlFor="resize-height">{mode === 'fit' ? 'Maximum height' : 'Height'}
                  <input id="resize-height" type="number" min="1" step="1" value={height} onChange={(event) => updateHeight(event.target.value)} className={fieldClass} />
                </label>
              </div>
            )}
            {mode === 'exact' && (
              <label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={locked} onChange={(event) => setLocked(event.target.checked)} />
                Lock aspect ratio
              </label>
            )}
            <p className="mt-3 text-sm text-muted">
              {preview?.dimensions ? `Output: ${preview.dimensions.width} × ${preview.dimensions.height} px` : preview?.error}
            </p>
          </fieldset>

          <fieldset className="mt-6 border-t border-line pt-6">
            <legend className="text-sm font-semibold text-ink">Output settings</legend>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-ink" htmlFor="resize-format">Format
                <select id="resize-format" value={outputMime} onChange={(event) => { setOutputMime(event.target.value as SupportedImageMime); setResult(null) }} className={fieldClass}>
                  {IMAGE_FORMATS.map((format) => <option key={format.id} value={format.mimeType}>{format.label}</option>)}
                </select>
              </label>
              {outputMime !== 'image/png' && (
                <label className="text-sm text-ink" htmlFor="resize-quality">Quality: {Math.round(quality * 100)}%
                  <input id="resize-quality" type="range" min="10" max="100" value={Math.round(quality * 100)} onChange={(event) => { setQuality(Number(event.target.value) / 100); setResult(null) }} className="mt-2 h-11 w-full appearance-none accent-accent [&::-moz-range-track]:h-2 [&::-webkit-slider-runnable-track]:h-2 [&::-moz-range-thumb]:size-5 [&::-webkit-slider-thumb]:size-5" />
                </label>
              )}
            </div>
            {outputMime === 'image/jpeg' && <p className="mt-3 text-[13px] leading-relaxed text-muted">JPG has no transparency. Transparent areas will use a white background.</p>}
            <label className="mt-4 flex min-h-11 items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={targetEnabled} disabled={outputMime === 'image/png'} onChange={(event) => { setTargetEnabled(event.target.checked); setResult(null) }} />
              Target a maximum file size
            </label>
            {outputMime === 'image/png' && <p className="text-[13px] text-muted">Target size is available for JPG and WebP because browser PNG encoding does not support quality control.</p>}
            {targetEnabled && outputMime !== 'image/png' && (
              <div className="mt-3 max-w-xs">
                <label className="text-sm text-ink" htmlFor="resize-target">Maximum size (KB)
                  <input id="resize-target" type="number" min="1" step="1" value={targetKb} onChange={(event) => { setTargetKb(event.target.value); setResult(null) }} className={fieldClass} />
                </label>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">Dimensions stay fixed. The tool adjusts quality in at most seven encoding attempts and reports the actual result.</p>
              </div>
            )}
          </fieldset>

          {processError && <div role="alert" className="mt-6 rounded-lg border border-danger/30 bg-danger-soft p-4"><h2 className="text-sm font-semibold text-ink">That didn't work</h2><p className="mt-1.5 text-sm leading-relaxed text-danger">{processError}</p></div>}

          {result && (
            <div className="mt-6 border-t border-line pt-6">
              <h2 className="text-base font-semibold text-ink">Ready to download</h2>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-3">
                <Stat label="Original dimensions" value={`${result.originalWidth} × ${result.originalHeight} px`} />
                <Stat label="Output dimensions" value={`${result.width} × ${result.height} px`} />
                <Stat label="Output format" value={result.outputFormat.label} />
                <Stat label="Original size" value={formatBytes(result.originalBytes)} />
                <Stat label="Output size" value={formatBytes(result.outputBytes)} />
                <Stat label="Transparency" value={result.outputFormat.supportsTransparency ? 'Preserved' : 'White background'} />
              </dl>
              {result.targetBytes && <p className="mt-3 text-sm text-muted">Target {formatBytes(result.targetBytes)} · actual {formatBytes(result.outputBytes)} · dimensions preserved</p>}
            </div>
          )}

          <div className="mt-6 space-y-2.5 border-t border-line pt-6">
            {result ? (
              <Button size="lg" className="w-full" onClick={() => downloadBlob(result.blob, result.filename)}><Download className="size-4" aria-hidden="true" />Download resized image</Button>
            ) : (
              <Button size="lg" className="w-full" disabled={busy || !preview?.dimensions} onClick={() => void process()}>{busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}{busy ? (targetEnabled ? 'Optimizing image…' : 'Resizing image…') : 'Resize image'}</Button>
            )}
            <Button variant="secondary" className="w-full" onClick={reset}><RotateCcw className="size-4" aria-hidden="true" />Resize another image</Button>
          </div>
        </div>
      )}
    </ToolShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-muted">{label}</dt><dd className="mt-0.5 break-words font-medium text-ink">{value}</dd></div>
}
