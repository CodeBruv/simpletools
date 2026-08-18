import { useState } from 'react'
import type { ReactNode } from 'react'
import { Check, Clipboard, RotateCcw, Sparkles } from 'lucide-react'

import PrivacyNote from '@/components/tools/PrivacyNote'
import ToolShell from '@/components/tools/ToolShell'
import { Button } from '@/components/ui/Button'
import type { ToolComponentProps } from '@/tools/registry'
import { FAQ, HELP } from '@/tools/password-generator/content'
import {
  DEFAULT_PASSWORD_OPTIONS,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  PasswordGenerationError,
  generatePassword,
} from '@/tools/password-generator/generatePassword'
import type { PasswordOptions } from '@/tools/password-generator/generatePassword'

const numberFieldClass = 'mt-2 h-11 w-full rounded-lg border border-line-strong bg-paper px-3 text-sm text-ink focus:border-accent focus:outline-none'
const rangeClass = 'mt-2 h-11 w-full appearance-none accent-accent [&::-moz-range-track]:h-2 [&::-webkit-slider-runnable-track]:h-2 [&::-moz-range-thumb]:size-5 [&::-webkit-slider-thumb]:size-5'

export default function PasswordGenerator({ tool }: ToolComponentProps) {
  const [options, setOptions] = useState<PasswordOptions>({ ...DEFAULT_PASSWORD_OPTIONS })
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  const hasPassword = password.length > 0

  function updateOption<K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }))
    setStatus('')
    setError('')
    setCopyState('idle')
  }

  function generate() {
    setCopyState('idle')
    setStatus('')
    setError('')

    try {
      setPassword(generatePassword(options))
      setStatus('New password generated')
    } catch (generationError) {
      setPassword('')
      setError(generationError instanceof PasswordGenerationError ? generationError.message : 'Unable to generate a password in this browser.')
    }
  }

  async function copyPassword() {
    if (!hasPassword) return

    try {
      await navigator.clipboard.writeText(password)
      setCopyState('copied')
      setStatus('Password copied')
      setError('')
    } catch {
      setCopyState('idle')
      setStatus('')
      setError('Unable to copy automatically. Select the password and copy it manually.')
    }
  }

  function reset() {
    setOptions({ ...DEFAULT_PASSWORD_OPTIONS })
    setPassword('')
    setStatus('')
    setError('')
    setCopyState('idle')
  }

  return (
    <ToolShell tool={tool} help={HELP} faq={FAQ}>
      <div className="mx-auto max-w-3xl">
        <div aria-live="polite" className="sr-only">{status}</div>

        <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
          <section aria-labelledby="password-result-heading">
            <div className="flex items-center justify-between gap-4">
              <h2 id="password-result-heading" className="text-base font-semibold text-ink">Generated password</h2>
              <span className="text-xs text-muted">{hasPassword ? `${password.length} characters` : 'Ready to generate'}</span>
            </div>
            <label htmlFor="generated-password" className="sr-only">Generated password</label>
            <input
              id="generated-password"
              type="text"
              value={password}
              readOnly
              spellCheck={false}
              autoComplete="off"
              placeholder="Your password will appear here."
              className="mt-3 h-16 w-full select-text rounded-lg border border-line-strong bg-paper px-4 font-mono text-base text-ink placeholder:font-sans placeholder:text-sm placeholder:text-muted/70 focus:border-accent focus:outline-none sm:text-lg"
            />
          </section>

          <fieldset className="mt-6 border-t border-line pt-6">
            <legend className="text-sm font-semibold text-ink">Password options</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem] sm:items-end">
              <label className="text-sm text-ink" htmlFor="password-length-range">
                Length: <span className="font-mono tabular-nums">{options.length}</span>
                <input
                  id="password-length-range"
                  type="range"
                  min={MIN_PASSWORD_LENGTH}
                  max={MAX_PASSWORD_LENGTH}
                  value={options.length}
                  onChange={(event) => updateOption('length', Number(event.target.value))}
                  className={rangeClass}
                />
              </label>
              <label className="text-sm text-ink" htmlFor="password-length">
                Characters
                <input
                  id="password-length"
                  type="number"
                  min={MIN_PASSWORD_LENGTH}
                  max={MAX_PASSWORD_LENGTH}
                  step="1"
                  value={options.length}
                  onChange={(event) => updateOption('length', Number(event.target.value))}
                  className={numberFieldClass}
                />
              </label>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <OptionCheckbox id="password-uppercase" checked={options.uppercase} onChange={(checked) => updateOption('uppercase', checked)}>
                Uppercase letters (A-Z)
              </OptionCheckbox>
              <OptionCheckbox id="password-lowercase" checked={options.lowercase} onChange={(checked) => updateOption('lowercase', checked)}>
                Lowercase letters (a-z)
              </OptionCheckbox>
              <OptionCheckbox id="password-numbers" checked={options.numbers} onChange={(checked) => updateOption('numbers', checked)}>
                Numbers (0-9)
              </OptionCheckbox>
              <OptionCheckbox id="password-symbols" checked={options.symbols} onChange={(checked) => updateOption('symbols', checked)}>
                Symbols
              </OptionCheckbox>
              <OptionCheckbox id="password-ambiguous" checked={options.excludeAmbiguous} onChange={(checked) => updateOption('excludeAmbiguous', checked)}>
                Exclude ambiguous characters
              </OptionCheckbox>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">At least one character type is required. Excluding ambiguous characters removes 0, O, o, 1, l, and I.</p>
          </fieldset>

          {(error || status) && (
            <div
              className={`mt-6 rounded-lg border p-3 text-sm ${error ? 'border-danger/30 bg-danger-soft text-danger' : 'border-accent/30 bg-accent-soft text-ink'}`}
              role={error ? 'alert' : 'status'}
            >
              {error || <span className="flex items-center gap-2"><Check className="size-4" aria-hidden="true" />{status}</span>}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row">
            <Button size="lg" className="sm:flex-1" onClick={generate}>
              <Sparkles className="size-4" aria-hidden="true" />Generate password
            </Button>
            <Button size="lg" variant="secondary" disabled={!hasPassword} onClick={() => void copyPassword()}>
              {copyState === 'copied' ? <Check className="size-4" aria-hidden="true" /> : <Clipboard className="size-4" aria-hidden="true" />}
              {copyState === 'copied' ? 'Copied' : 'Copy'}
            </Button>
            <Button size="lg" variant="ghost" onClick={reset}>
              <RotateCcw className="size-4" aria-hidden="true" />Reset
            </Button>
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <PrivacyNote>
              Passwords are generated locally with the browser Web Crypto API. They are not uploaded or stored by SimpleTools, and no account is required.
            </PrivacyNote>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}

function OptionCheckbox({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label htmlFor={id} className="flex min-h-11 items-center gap-2 rounded-lg border border-line-strong bg-paper px-3 text-sm text-ink">
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {children}
    </label>
  )
}

