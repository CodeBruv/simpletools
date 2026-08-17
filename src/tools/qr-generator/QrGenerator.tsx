import { useMemo, useState } from 'react'
import { Download, QrCode } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import ToolShell, { type FaqItem } from '@/components/tools/ToolShell'
import { downloadBlob } from '@/lib/download'
import { cn } from '@/lib/utils'
import type { ToolComponentProps } from '@/tools/registry'
import {
  EMPTY_FIELDS,
  QR_TYPES,
  buildPayload,
  downloadName,
} from '@/tools/qr-generator/payloads'
import { QrEncodeError, encodeQr } from '@/tools/qr-generator/qrEncoder'
import {
  DEFAULT_APPEARANCE,
  toPath,
  toPngBlob,
  toSvgBlob,
  totalModules,
} from '@/tools/qr-generator/render'
import AppearanceControls from '@/tools/qr-generator/AppearanceControls'
import QrFieldset from '@/tools/qr-generator/QrFieldset'
import type { QrAppearance, QrFieldName, QrFields, QrType } from '@/tools/qr-generator/types'

/**
 * QR Code Generator.
 *
 * The code updates as you type — there is no Generate button, because there is
 * nothing to wait for: encoding a QR is fast enough that a button would only
 * add a step. Everything runs here in the browser; nothing is uploaded and
 * nothing is kept once the tab closes.
 *
 * The preview is inline SVG rather than an <img> with a data URL, so there is
 * no per-keystroke blob to create and revoke, and no HTML is ever injected.
 */

/** Errors keyed by field, so each one renders against its own input. */
type FieldErrors = Partial<Record<QrFieldName, string>>

const HELP = (
  <>
    <p>
      Pick what you want the code to do, fill in the details, and the code appears as you type.
      Download it as a PNG for documents and printing, or an SVG if it needs to scale to a poster
      without going blurry.
    </p>
    <p>
      Test it with your own phone camera before you print anything, especially at small sizes. If it
      does not read, make the code bigger, widen the border, or move back to darker colours on a
      light background.
    </p>
  </>
)

const FAQ: readonly FaqItem[] = [
  {
    question: 'Does the code stop working after a while?',
    answer:
      'No. The information is stored in the pattern itself, so the code keeps working for as long as whatever it points at exists. There is nothing to renew and no link that can expire.',
  },
  {
    question: 'Can I change where it points after printing it?',
    answer:
      'No. The address is part of the pattern, so changing it means making a new code. If you expect the destination to move, point the code at a web address you control and change what sits behind that address instead.',
  },
  {
    question: 'Which size should I download?',
    answer:
      'For anything printed, use the largest PNG or the SVG. As a rough guide a code needs to be about a tenth as wide as the distance it will be scanned from, so a code read from two metres away wants to be around 20cm across.',
  },
  {
    question: 'Is my Wi-Fi password safe here?',
    answer:
      'It never leaves your device. The code is built in your browser and nothing is sent anywhere. Bear in mind that anyone who can scan the finished code can join the network, so treat a printed Wi-Fi code the same way you would treat the password itself.',
  },
  {
    question: 'Why does my code look more complicated than another one?',
    answer:
      'More information means a denser pattern. A short web address makes a simple code; a long address with tracking parameters makes a dense one. Shortening the link is the most effective way to simplify the pattern.',
  },
]

export default function QrGenerator({ tool }: ToolComponentProps) {
  const [type, setType] = useState<QrType>('url')
  const [fields, setFields] = useState<QrFields>(EMPTY_FIELDS)
  const [appearance, setAppearance] = useState<QrAppearance>(DEFAULT_APPEARANCE)
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const updateField = <K extends QrFieldName>(field: K, value: QrFields[K]) => {
    setFields((current) => ({ ...current, [field]: value }))
    setDownloadError(null)
  }

  const updateAppearance = <K extends keyof QrAppearance>(key: K, value: QrAppearance[K]) => {
    setAppearance((current) => ({ ...current, [key]: value }))
    setDownloadError(null)
  }

  /**
   * Validation runs on every change, but only surfaces once the user has
   * engaged with the field — nobody wants to be told the form is wrong before
   * they have started filling it in.
   */
  const result = useMemo(() => buildPayload(type, fields), [type, fields])

  const errors: FieldErrors = useMemo(() => {
    if (result.ok) return {}

    const map: FieldErrors = {}
    for (const error of result.errors) map[error.field] = error.message
    return map
  }, [result])

  /** Encoding can still refuse an over-long payload, which is a user-facing message. */
  const encoded = useMemo(() => {
    if (!result.ok) return null

    try {
      return {
        matrix: encodeQr(result.payload, { errorCorrection: appearance.errorCorrection }),
        error: null,
      }
    } catch (error) {
      return {
        matrix: null,
        error:
          error instanceof QrEncodeError
            ? error.message
            : 'That could not be turned into a QR code. Try shortening it.',
      }
    }
  }, [result, appearance.errorCorrection])

  const matrix = encoded?.matrix ?? null
  const visibleErrors = showErrors ? errors : {}
  const touched = Object.values(fields).some((value) =>
    typeof value === 'string' ? value.trim().length > 0 : value !== false,
  )

  const download = async (format: 'png' | 'svg') => {
    if (!matrix) return

    setBusy(true)
    setDownloadError(null)

    try {
      const blob =
        format === 'png'
          ? await toPngBlob(matrix, appearance)
          : toSvgBlob(matrix, appearance)

      downloadBlob(blob, downloadName(type, format))
    } catch {
      setDownloadError('The image could not be saved. Try again, or switch to the other format.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolShell tool={tool} help={HELP} faq={FAQ}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 rounded-xl border border-line bg-surface p-5 sm:p-6 lg:col-start-1 lg:row-start-1">
          <fieldset className="min-w-0">
              <legend className="eyebrow">What should it do?</legend>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {QR_TYPES.map((option) => {
                  const active = type === option.value

                  return (
                    <label
                      key={option.value}
                      className={cn(
                        'flex min-h-11 cursor-pointer flex-col justify-center rounded-lg border px-3 py-2',
                        'transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2',
                        'has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                        active
                          ? 'border-accent bg-accent-soft'
                          : 'border-line bg-canvas hover:border-line-strong',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="qr-type"
                          value={option.value}
                          checked={active}
                          onChange={() => {
                            setType(option.value)
                            setShowErrors(false)
                            setDownloadError(null)
                          }}
                          className="size-4 shrink-0 accent-accent"
                        />
                        <span className="text-sm font-medium text-ink">{option.label}</span>
                      </span>
                      <span className="mt-0.5 pl-6 text-[13px] leading-snug text-muted">
                        {option.hint}
                      </span>
                    </label>
                  )
                })}
              </div>
          </fieldset>

          <div className="mt-6" onBlur={() => setShowErrors(true)}>
            <QrFieldset
              type={type}
              fields={fields}
              errors={visibleErrors}
              onChange={updateField}
            />
          </div>
        </section>

        {/*
          The single preview follows the payload fields in the DOM. On a wide
          screen it moves to the sticky right column without changing the
          sequential mobile or assistive-technology reading order.
        */}
        <aside className="min-w-0 lg:sticky lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:top-24 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="eyebrow">Your code</h2>

            <div
              className={cn(
                'mt-4 flex aspect-square w-full items-center justify-center overflow-hidden',
                'rounded-lg border border-line',
              )}
              style={{ backgroundColor: matrix ? appearance.background : undefined }}
            >
              {matrix ? (
                <svg
                  viewBox={`0 0 ${totalModules(matrix, appearance.margin)} ${totalModules(matrix, appearance.margin)}`}
                  shapeRendering="crispEdges"
                  role="img"
                  aria-label={`QR code for the ${type} details you entered`}
                  className="h-full w-full"
                >
                  <rect
                    width={totalModules(matrix, appearance.margin)}
                    height={totalModules(matrix, appearance.margin)}
                    fill={appearance.background}
                  />
                  <path d={toPath(matrix, appearance.margin)} fill={appearance.foreground} />
                </svg>
              ) : (
                <p className="flex max-w-[16rem] flex-col items-center gap-3 p-6 text-center text-sm text-muted">
                  <QrCode className="size-8 text-subtle" strokeWidth={1.5} aria-hidden="true" />
                  <span>
                    {encoded?.error ??
                      (touched && showErrors
                        ? 'Fix the details on the left and your code will appear here.'
                        : 'Fill in the details and your code appears here.')}
                  </span>
                </p>
              )}
            </div>

            <div className="mt-5 space-y-2">
              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={!matrix || busy}
                onClick={() => void download('png')}
              >
                <Download className="size-4" strokeWidth={2} aria-hidden="true" />
                {busy ? 'Saving…' : 'Download PNG'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
                disabled={!matrix || busy}
                onClick={() => void download('svg')}
              >
                Download SVG
              </Button>
            </div>

            {downloadError && (
              <p className="mt-3 text-[13px] leading-relaxed text-danger">{downloadError}</p>
            )}

            {matrix && (
              <p className="mt-4 border-t border-line pt-4 text-[13px] leading-relaxed text-muted">
                Scan it with your phone camera to check it before you print or share it.
              </p>
            )}
          </div>

          {/*
            Announced rather than shown: sighted users already see the code
            appear, but a screen reader user gets no signal from a silent SVG
            swap.
          */}
          <p aria-live="polite" className="sr-only">
            {matrix
              ? `QR code ready. ${matrix.size} by ${matrix.size} squares.`
              : (encoded?.error ?? 'Waiting for the details.')}
          </p>
        </aside>

        <section className="min-w-0 rounded-xl border border-line bg-surface p-5 sm:p-6 lg:col-start-1 lg:row-start-2">
          <h2 className="eyebrow">Appearance</h2>
          <div className="mt-4">
            <AppearanceControls appearance={appearance} onChange={updateAppearance} />
          </div>
        </section>
      </div>
    </ToolShell>
  )
}
