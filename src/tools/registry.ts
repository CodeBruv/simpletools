import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import { FileArchive, ImageDown, QrCode, Percent, ReceiptText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { Category, CategoryId } from '@/data/categories'
import { CATEGORIES } from '@/data/categories'
import type { Crumb } from '@/lib/paths'
import { TOOLS_PATH, categoryPath } from '@/lib/paths'

/**
 * Whether the tool is usable today, or registered but not yet built.
 * Planned tools still get a real, crawlable route and a real card — they
 * just render an honest "not built yet" state instead of a fake UI.
 */
export type ToolStatus = 'available' | 'planned'

export interface Tool {
  /** URL segment: /tools/<slug> */
  slug: string
  name: string
  /** One line, used on cards and as the page subtitle. */
  description: string
  category: CategoryId
  icon: LucideIcon
  status: ToolStatus
  /** Surfaced on the homepage. */
  featured: boolean
  /** True when all processing happens in the browser. Drives the privacy note. */
  clientOnly: boolean
  /** Extra search terms that users type but that aren't in the name. */
  keywords: readonly string[]
  seo: {
    title: string
    description: string
  }
  /**
   * Lazily-loaded implementation. Undefined while status is 'planned'.
   * Lazy so that a tool's dependencies never reach the homepage bundle.
   */
  component?: LazyExoticComponent<ComponentType<ToolComponentProps>>
}

/** Props every tool implementation receives from the router. */
export interface ToolComponentProps {
  tool: Tool
}

export const TOOLS: readonly Tool[] = [
  {
    slug: 'image-compressor',
    name: 'Image Compressor',
    description: 'Shrink JPG, PNG and WebP files while keeping them sharp.',
    category: 'images',
    icon: ImageDown,
    status: 'available',
    featured: true,
    clientOnly: true,
    keywords: ['compress', 'shrink', 'reduce', 'optimise', 'optimize', 'jpg', 'jpeg', 'png', 'webp', 'photo', 'size'],
    seo: {
      title: 'Image Compressor — Compress Images Online | SimpleTools',
      description:
        'Compress JPG, PNG and WebP images in your browser. Pick your quality, see exactly how much you saved, then download. Your images never leave your device.',
    },
    component: lazy(() => import('@/tools/image-compressor/ImageCompressor')),
  },
  {
    slug: 'pdf-compressor',
    name: 'PDF Compressor',
    description: 'Make PDF files smaller so they fit an upload limit.',
    category: 'pdfs',
    icon: FileArchive,
    status: 'available',
    featured: true,
    clientOnly: true,
    keywords: ['pdf', 'compress', 'shrink', 'reduce', 'document', 'size', 'email'],
    seo: {
      title: 'PDF Compressor — Compress PDF Files Online | SimpleTools',
      description:
        'Compress PDF files in your browser. Keep text selectable, or squeeze harder, and see exactly what you saved. Your PDF never leaves your device.',
    },
    component: lazy(() => import('@/tools/pdf-compressor/PdfCompressor')),
  },
  {
    slug: 'qr-code-generator',
    name: 'QR Code Generator',
    description: 'Make a QR code for a link, text, email, phone number or Wi-Fi.',
    category: 'generators',
    icon: QrCode,
    status: 'available',
    featured: true,
    clientOnly: true,
    keywords: [
      'qr',
      'code',
      'barcode',
      'link',
      'url',
      'scan',
      'generate',
      'wifi',
      'vcard',
      'sms',
      'email',
      'phone',
    ],
    seo: {
      title: 'QR Code Generator — Create QR Codes Free | SimpleTools',
      description:
        'Make a QR code for a link, text, email, phone number, SMS or Wi-Fi network. Download it as a PNG or SVG. Free, no account, made in your browser.',
    },
    component: lazy(() => import('@/tools/qr-generator/QrGenerator')),
  },
  {
    slug: 'profit-margin-calculator',
    name: 'Profit Margin Calculator',
    description: 'Work out margin, markup and profit from cost and price.',
    category: 'finance',
    icon: Percent,
    status: 'planned',
    featured: true,
    clientOnly: true,
    keywords: ['profit', 'margin', 'markup', 'cost', 'price', 'revenue', 'calculator'],
    seo: {
      title: 'Profit Margin Calculator — Margin & Markup | SimpleTools',
      description:
        'Calculate profit margin, markup and gross profit from your cost and selling price. Free and instant. Coming soon to SimpleTools.',
    },
  },
  {
    slug: 'invoice-generator',
    name: 'Invoice Generator',
    description: 'Fill in line items and get a clean, printable invoice.',
    category: 'business',
    icon: ReceiptText,
    status: 'available',
    featured: true,
    clientOnly: true,
    keywords: ['invoice', 'bill', 'receipt', 'freelance', 'client', 'pdf', 'template', 'quote'],
    seo: {
      title: 'Free Invoice Generator — SimpleTools',
      description:
        'Create a professional invoice in your browser: line items, discount, tax and totals in 17 currencies. Print it or save it as a PDF. No signup, nothing uploaded.',
    },
    component: lazy(() => import('@/tools/invoice-generator/InvoiceGenerator')),
  },
] as const

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((tool) => tool.slug === slug)
}

export function getToolsByCategory(category: CategoryId): Tool[] {
  return TOOLS.filter((tool) => tool.category === category)
}

export function getFeaturedTools(): Tool[] {
  return TOOLS.filter((tool) => tool.featured)
}

/**
 * Tools a visitor can actually use today.
 *
 * Pages talk about availability often enough ("4 tools ready to use") that
 * counting inline in each one would eventually disagree with the registry.
 */
export function getAvailableTools(): Tool[] {
  return TOOLS.filter((tool) => tool.status === 'available')
}

/** Available tools first, so the homepage leads with things that work. */
export function byAvailabilityThenName(a: Tool, b: Tool): number {
  if (a.status !== b.status) return a.status === 'available' ? -1 : 1
  return a.name.localeCompare(b.name)
}

/**
 * Related tools for a given tool: same category first, then anything else,
 * always preferring tools that actually work.
 */
export function getRelatedTools(slug: string, limit = 3): Tool[] {
  const current = getTool(slug)
  if (!current) return []

  const sameCategory = TOOLS.filter((t) => t.slug !== slug && t.category === current.category)
  const others = TOOLS.filter((t) => t.slug !== slug && t.category !== current.category)

  return [...sameCategory.sort(byAvailabilityThenName), ...others.sort(byAvailabilityThenName)].slice(
    0,
    limit,
  )
}

/* ------------------------------------------------------------------ *
 * Navigation
 *
 * Navigation is *derived*, never declared. There is deliberately no
 * navigation module holding a second list of tools: adding a tool means
 * adding one entry above, and every menu, breadcrumb and category page
 * picks it up. A parallel list would drift the day someone forgot it.
 * ------------------------------------------------------------------ */

/** One category plus the tools that belong to it, ready to render as a menu. */
export interface NavCategory {
  category: Category
  tools: Tool[]
  /** How many of those tools are usable today, for an honest menu count. */
  availableCount: number
}

/**
 * The category-first navigation tree.
 *
 * Categories keep their curated order from CATEGORIES; tools are sorted so
 * working ones come first. A category with no tools is omitted — offering a
 * menu entry that leads to an empty page is worse than not offering it.
 */
export function getNavigationTree(): NavCategory[] {
  const tree: NavCategory[] = []

  for (const category of CATEGORIES) {
    const tools = getToolsByCategory(category.id).sort(byAvailabilityThenName)
    if (tools.length === 0) continue

    tree.push({
      category,
      tools,
      availableCount: tools.filter((tool) => tool.status === 'available').length,
    })
  }

  return tree
}

export function getToolCategory(slug: string): Category | undefined {
  const tool = getTool(slug)
  if (!tool) return undefined
  return CATEGORIES.find((category) => category.id === tool.category)
}

/**
 * Breadcrumb trail for a tool page: All Tools / Category / Tool.
 *
 * Home is intentionally absent — the header logo is the route home, and
 * repeating it here would be duplicate navigation rather than hierarchy.
 * Returns an empty trail for an unknown slug so a 404 cannot render crumbs.
 */
export function getToolTrail(slug: string): Crumb[] {
  const tool = getTool(slug)
  if (!tool) return []

  const category = getToolCategory(slug)

  return [
    { label: 'All Tools', to: TOOLS_PATH, back: true },
    ...(category ? [{ label: category.name, to: categoryPath(category.slug) }] : []),
    { label: tool.name },
  ]
}

/**
 * Substring search across name, description and keywords.
 * Ranked so that a name match always beats a keyword match.
 */
export function searchTools(rawQuery: string): Tool[] {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return []

  const scored: Array<{ tool: Tool; score: number }> = []

  for (const tool of TOOLS) {
    const name = tool.name.toLowerCase()
    let score = 0

    if (name.startsWith(query)) score = 100
    else if (name.includes(query)) score = 80
    else if (tool.keywords.some((k) => k.startsWith(query))) score = 60
    else if (tool.description.toLowerCase().includes(query)) score = 40

    if (score > 0) {
      if (tool.status === 'available') score += 5
      scored.push({ tool, score })
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .map((entry) => entry.tool)
}
