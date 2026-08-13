import { useEffect } from 'react'

const SITE_NAME = 'SimpleTools'
const SITE_ORIGIN = 'https://simpletools.site'
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-default.png`

export interface PageMeta {
  title: string
  description: string
  /** Path beginning with '/', e.g. '/tools/image-compressor'. */
  path: string
  ogImage?: string
  /**
   * Marks the page as not-found or otherwise unindexable. Suppresses the
   * canonical link, since pointing one at a page that isn't real is worse
   * than having none.
   */
  noindex?: boolean
}

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

function removeElement(selector: string) {
  document.head.querySelector(selector)?.remove()
}

/**
 * Per-route document metadata.
 *
 * This is a client-side implementation, which is enough for correct sharing
 * and canonical behaviour in crawlers that execute JavaScript. If full
 * pre-rendered metadata becomes a requirement, the fix is a static
 * pre-render step at build time — the shape of this data does not change.
 */
export function usePageMeta({ title, description, path, ogImage, noindex = false }: PageMeta): void {
  useEffect(() => {
    const url = `${SITE_ORIGIN}${path}`
    const image = ogImage ?? DEFAULT_OG_IMAGE

    document.title = title
    upsertMeta('meta[name="description"]', 'name', 'description', description)

    // Both branches must clean up after the other, since a single-page app
    // reuses this one <head> across every navigation.
    if (noindex) {
      upsertMeta('meta[name="robots"]', 'name', 'robots', 'noindex')
      removeElement('link[rel="canonical"]')
    } else {
      removeElement('meta[name="robots"]')
      upsertCanonical(url)
    }

    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title)
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description)
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', url)
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', image)
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website')
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME)
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
  }, [title, description, path, ogImage, noindex])
}
