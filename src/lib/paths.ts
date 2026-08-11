/**
 * Every internal URL in SimpleTools is built here.
 *
 * Navigation, breadcrumbs, cards, search and page metadata all need the same
 * addresses. Building them in one place is what guarantees a tool has exactly
 * one URL — a duplicate address is an SEO bug that is invisible in review.
 */
export const HOME_PATH = '/'
export const TOOLS_PATH = '/tools'
export const CATEGORIES_PATH = '/categories'

export function toolPath(slug: string): string {
  return `${TOOLS_PATH}/${slug}`
}

export function categoryPath(slug: string): string {
  return `${CATEGORIES_PATH}/${slug}`
}

/** One step in a breadcrumb trail. The final step has no `to` — it is the current page. */
export interface Crumb {
  label: string
  to?: string
  /**
   * Renders a leading back arrow. Set on the first step so a visitor who
   * arrived from a search engine has an obvious way up the hierarchy.
   */
  back?: boolean
}
