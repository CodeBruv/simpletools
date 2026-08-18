import { useState } from 'react'
import { Check, Clipboard, Download, RotateCcw } from 'lucide-react'

import ToolShell from '@/components/tools/ToolShell'
import { Button } from '@/components/ui/Button'
import { downloadBlob } from '@/lib/download'
import { FAQ, HELP } from '@/tools/json-formatter/content'
import {
  formatJsonError,
  processJson,
} from '@/tools/json-formatter/formatJson'
import type { JsonIndentation, JsonOperation } from '@/tools/json-formatter/formatJson'
import type { ToolComponentProps } from '@/tools/registry'

const EXAMPLE = '{\n  "name": "SimpleTools",\n  "active": true\n}'

export default function JsonFormatter({ tool }: ToolComponentProps) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [indentation, setIndentation] = useState<JsonIndentation>(2)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  const hasInput = input.trim().length > 0
  const hasOutput = output.length > 0

  function run(operation: JsonOperation) {
    const result = processJson(input, operation, indentation)
    setCopyState('idle')

    if (!result.ok) {
      setOutput(operation === 'validate' ? output : '')
      setStatus('')
      setError(result.error ? formatJsonError(result.error) : 'Invalid JSON.')
      return
    }

    setError('')
    if (operation === 'validate') {
      setStatus('Valid JSON')
      return
    }

    setOutput(result.output ?? '')
    setStatus(operation === 'minify' ? 'JSON minified' : 'JSON formatted')
  }

  async function copyOutput() {
    if (!hasOutput) return

    try {
      await navigator.clipboard.writeText(output)
      setCopyState('copied')
      setStatus('Copied')
      setError('')
    } catch {
      setCopyState('idle')
      setError('Unable to copy automatically. Please copy the output manually.')
      setStatus('')
    }
  }

  function downloadOutput() {
    if (!hasOutput) return

    try {
      downloadBlob(new Blob([output], { type: 'application/json;charset=utf-8' }), 'formatted.json')
      setStatus('Download started')
      setError('')
    } catch {
      setError('Unable to download the result. Please copy the output manually.')
      setStatus('')
    }
  }

  function reset() {
    setInput('')
    setOutput('')
    setStatus('')
    setError('')
    setCopyState('idle')
  }

  return (
    <ToolShell tool={tool} help={HELP} faq={FAQ}>
      <div className="mx-auto max-w-4xl">
        <div className="sr-only" aria-live="polite">
          {status}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="json-input-heading">
            <div className="flex items-center justify-between gap-4">
              <h2 id="json-input-heading" className="text-base font-semibold text-ink">
                Input JSON
              </h2>
              <span className="text-xs text-muted">Paste or type</span>
            </div>
            <label htmlFor="json-input" className="sr-only">
              Input JSON
            </label>
            <textarea
              id="json-input"
              value={input}
              onChange={(event) => {
                setInput(event.target.value)
                setError('')
                setStatus('')
                setCopyState('idle')
              }}
              placeholder={EXAMPLE}
              spellCheck={false}
              className="mt-3 min-h-80 w-full resize-y rounded-xl border border-line-strong bg-paper p-4 font-mono text-sm leading-relaxed text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none"
            />
          </section>

          <section aria-labelledby="json-output-heading">
            <div className="flex items-center justify-between gap-4">
              <h2 id="json-output-heading" className="text-base font-semibold text-ink">
                Output
              </h2>
              <span className="text-xs text-muted">Read-only result</span>
            </div>
            <label htmlFor="json-output" className="sr-only">
              Formatted JSON output
            </label>
            <textarea
              id="json-output"
              value={output}
              readOnly
              spellCheck={false}
              placeholder="Your formatted result will appear here."
              className="mt-3 min-h-80 w-full resize-y rounded-xl border border-line-strong bg-surface p-4 font-mono text-sm leading-relaxed text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none"
            />
          </section>
        </div>

        <div className="mt-6 rounded-xl border border-line bg-surface p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <label htmlFor="json-indentation" className="text-sm font-medium text-ink">
                Indentation
              </label>
              <select
                id="json-indentation"
                value={indentation === '\t' ? 'tabs' : indentation}
                onChange={(event) =>
                  setIndentation(event.target.value === 'tabs' ? '\t' : Number(event.target.value) as 2 | 4)
                }
                className="mt-2 h-11 w-full rounded-lg border border-line-strong bg-paper px-3 text-sm text-ink focus:border-accent focus:outline-none lg:w-40"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value="tabs">Tabs</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="md" disabled={!hasInput} onClick={() => run('format')}>
                Format
              </Button>
              <Button size="md" variant="secondary" disabled={!hasInput} onClick={() => run('minify')}>
                Minify
              </Button>
              <Button size="md" variant="secondary" disabled={!hasInput} onClick={() => run('validate')}>
                Validate
              </Button>
              <Button size="md" variant="ghost" disabled={!hasInput && !hasOutput} onClick={reset}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Clear
              </Button>
            </div>
          </div>

          {(error || status) && (
            <div
              className={`mt-4 rounded-lg border p-3 text-sm ${error ? 'border-danger/30 bg-danger-soft text-danger' : 'border-accent/30 bg-accent-soft text-ink'}`}
              role={error ? 'alert' : 'status'}
            >
              {error ? <>{error}</> : <span className="flex items-center gap-2"><Check className="size-4" aria-hidden="true" />{status}</span>}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" disabled={!hasOutput} onClick={() => void copyOutput()}>
            {copyState === 'copied' ? <Check className="size-4" aria-hidden="true" /> : <Clipboard className="size-4" aria-hidden="true" />}
            {copyState === 'copied' ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="secondary" disabled={!hasOutput} onClick={downloadOutput}>
            <Download className="size-4" aria-hidden="true" />
            Download JSON
          </Button>
        </div>
      </div>
    </ToolShell>
  )
}
