import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, test } from 'node:test'

import {
  ADCASH_SCRIPT_ID,
  ADCASH_SCRIPT_SRC,
  startAdCashAutotag,
} from './adcashAutotag'

interface Listener {
  callback: () => void
  once: boolean
}

class FakeScriptElement {
  async = false
  id = ''
  src = ''
  tagName = 'SCRIPT'
  private readonly attributes = new Map<string, string>()
  private readonly listeners = new Map<string, Listener[]>()

  addEventListener(type: string, callback: () => void, options?: { once?: boolean }) {
    const listeners = this.listeners.get(type) ?? []
    listeners.push({ callback, once: options?.once ?? false })
    this.listeners.set(type, listeners)
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value)
  }

  dispatch(type: 'load' | 'error') {
    const listeners = this.listeners.get(type) ?? []
    this.listeners.set(
      type,
      listeners.filter((listener) => !listener.once),
    )
    for (const listener of listeners) listener.callback()
  }
}

function installBrowser() {
  const scripts: FakeScriptElement[] = []
  const activations: Array<{ zoneId: string }> = []
  let createCount = 0

  const fakeWindow = {} as Window & Record<string, unknown>
  const fakeDocument = {
    createElement(tagName: string) {
      assert.equal(tagName, 'script')
      createCount += 1
      return new FakeScriptElement()
    },
    getElementById(id: string) {
      return scripts.find((script) => script.id === id) ?? null
    },
    head: {
      appendChild(script: FakeScriptElement) {
        scripts.push(script)
        return script
      },
    },
  }

  Object.assign(globalThis, {
    document: fakeDocument,
    window: fakeWindow,
  })

  return {
    activations,
    exposeLibrary() {
      fakeWindow.aclib = {
        runAutoTag(options: { zoneId: string }) {
          activations.push(options)
        },
      }
    },
    get createCount() {
      return createCount
    },
    scripts,
  }
}

describe('AdCash Autotag document lifecycle', () => {
  test('disabled configuration does not create a script or activate AdCash', async () => {
    const browser = installBrowser()

    await startAdCashAutotag({ enabled: false, zoneId: 'disabled-zone' })

    assert.equal(browser.createCount, 0)
    assert.deepEqual(browser.scripts, [])
    assert.deepEqual(browser.activations, [])
  })

  test('concurrent mounts and later remounts share one script and one activation', async () => {
    const browser = installBrowser()

    const firstMount = startAdCashAutotag({ enabled: true, zoneId: 'idmmf206vi' })
    const strictModeMount = startAdCashAutotag({ enabled: true, zoneId: 'idmmf206vi' })

    assert.equal(browser.createCount, 1)
    assert.equal(browser.scripts.length, 1)
    assert.equal(browser.scripts[0].id, ADCASH_SCRIPT_ID)
    assert.equal(browser.scripts[0].src, ADCASH_SCRIPT_SRC)
    assert.equal(browser.scripts[0].async, true)

    browser.exposeLibrary()
    browser.scripts[0].dispatch('load')
    await Promise.all([firstMount, strictModeMount])

    assert.deepEqual(browser.activations, [{ zoneId: 'idmmf206vi' }])

    await startAdCashAutotag({ enabled: true, zoneId: 'idmmf206vi' })
    assert.equal(browser.scripts.length, 1)
    assert.deepEqual(browser.activations, [{ zoneId: 'idmmf206vi' }])
  })

  test('script failure rejects without activation and preserves an outputless host contract', async () => {
    const browser = installBrowser()
    const activation = startAdCashAutotag({ enabled: true, zoneId: 'idmmf206vi' })

    browser.scripts[0].dispatch('error')

    await assert.rejects(activation, /failed to load/)
    assert.deepEqual(browser.activations, [])
    assert.equal(browser.scripts.length, 1)
  })

  test('an already available library activates without injecting a script', async () => {
    const browser = installBrowser()
    browser.exposeLibrary()

    await startAdCashAutotag({ enabled: true, zoneId: 'idmmf206vi' })

    assert.equal(browser.createCount, 0)
    assert.deepEqual(browser.activations, [{ zoneId: 'idmmf206vi' }])
  })
})

describe('AdCash architecture boundary', () => {
  test('the global experience is mounted once at the application root and renders no DOM', async () => {
    const appSource = await readFile(new URL('../../app/App.tsx', import.meta.url), 'utf8')
    const componentSource = await readFile(
      new URL('./AdCashAutotagExperience.tsx', import.meta.url),
      'utf8',
    )

    assert.equal((appSource.match(/<AdCashAutotagExperience\s*\/>/g) ?? []).length, 1)
    assert.match(componentSource, /return null/)
    assert.match(componentSource, /\.catch\(\(\) =>/)
  })

  test('AdCash does not enter the display-slot resolver, slot, or AdSense adapter', async () => {
    const sources = await Promise.all(
      ['adResolver.ts', 'AdSlot.tsx', 'providers/AdSenseAdapter.tsx'].map((path) =>
        readFile(new URL(path, import.meta.url), 'utf8'),
      ),
    )

    for (const source of sources) assert.doesNotMatch(source, /adcash|aclib|runAutoTag/i)
  })

  test('the live configuration uses the approved zone independently of the slot provider', async () => {
    const configSource = await readFile(new URL('./adConfig.ts', import.meta.url), 'utf8')

    assert.match(configSource, /ADCASH_AUTOTAG_ENABLED\s*=\s*true/)
    assert.match(configSource, /ADCASH_AUTOTAG_ZONE_ID\s*=\s*['"]idmmf206vi['"]/)
    assert.match(configSource, /ACTIVE_AD_PROVIDER:\s*AdProviderId\s*\|\s*null\s*=\s*['"]adsense['"]/)
  })
})
