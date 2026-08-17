const ADCASH_SCRIPT_ID = 'adcash-aclib'
const ADCASH_SCRIPT_SRC = 'https://acscdn.com/script/aclib.js'
const ADCASH_SCRIPT_MARKER = '__simpletoolsAdCashAutotag'
const ADCASH_LOAD_STATE_ATTRIBUTE = 'data-adcash-load-state'

type AdCashDocumentState = {
  activated?: boolean
  activationPromise?: Promise<void>
}

type AdCashWindow = Window & {
  [ADCASH_SCRIPT_MARKER]?: AdCashDocumentState
}

interface StartAdCashAutotagOptions {
  enabled: boolean
  zoneId: string
}

function getDocumentState(): AdCashDocumentState {
  const adCashWindow = window as AdCashWindow
  const state = adCashWindow[ADCASH_SCRIPT_MARKER] ?? {}
  adCashWindow[ADCASH_SCRIPT_MARKER] = state
  return state
}

function waitForAdCashLibrary(): Promise<void> {
  if (window.aclib) return Promise.resolve()

  return new Promise<void>((resolve, reject) => {
    const existingElement = document.getElementById(ADCASH_SCRIPT_ID)
    const existingScript =
      existingElement?.tagName === 'SCRIPT' ? (existingElement as HTMLScriptElement) : null
    const script = existingScript ?? document.createElement('script')

    const loadState = script.getAttribute(ADCASH_LOAD_STATE_ATTRIBUTE)
    if (loadState === 'loaded') {
      reject(new Error('AdCash library loaded without exposing its API'))
      return
    }
    if (loadState === 'failed') {
      reject(new Error('AdCash library failed to load'))
      return
    }

    const handleLoad = () => {
      script.setAttribute(ADCASH_LOAD_STATE_ATTRIBUTE, 'loaded')
      resolve()
    }
    const handleError = () => {
      script.setAttribute(ADCASH_LOAD_STATE_ATTRIBUTE, 'failed')
      reject(new Error('AdCash library failed to load'))
    }

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })

    if (!existingScript) {
      script.id = ADCASH_SCRIPT_ID
      script.src = ADCASH_SCRIPT_SRC
      script.async = true
      document.head.appendChild(script)
    }
  })
}

function startAdCashAutotag({
  enabled,
  zoneId,
}: StartAdCashAutotagOptions): Promise<void> {
  if (!enabled) return Promise.resolve()

  const state = getDocumentState()
  if (state.activated) return Promise.resolve()
  if (state.activationPromise) return state.activationPromise

  state.activationPromise = waitForAdCashLibrary().then(() => {
    if (state.activated) return
    if (!window.aclib) throw new Error('AdCash library API is unavailable')

    window.aclib.runAutoTag({ zoneId })
    state.activated = true
  })

  return state.activationPromise
}

export { ADCASH_SCRIPT_ID, ADCASH_SCRIPT_SRC, startAdCashAutotag }
