import { Briefcase, FileText, Image, PiggyBank, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type CategoryId = 'images' | 'pdfs' | 'generators' | 'finance' | 'business'

export interface Category {
  id: CategoryId
  /** URL segment: /categories/<slug> */
  slug: string
  name: string
  /** Shown on category pages and cards. */
  description: string
  icon: LucideIcon
}

export const CATEGORIES: readonly Category[] = [
  {
    id: 'images',
    slug: 'images',
    name: 'Images',
    description: 'Resize, compress and convert pictures without leaving the page.',
    icon: Image,
  },
  {
    id: 'pdfs',
    slug: 'pdfs',
    name: 'PDFs & Documents',
    description: 'Shrink, split and reshape documents in the browser.',
    icon: FileText,
  },
  {
    id: 'generators',
    slug: 'generators',
    name: 'Generators',
    description: 'Make codes, passwords and boilerplate on demand.',
    icon: Sparkles,
  },
  {
    id: 'finance',
    slug: 'finance',
    name: 'Finance',
    description: 'Work out margins, rates and returns quickly.',
    icon: PiggyBank,
  },
  {
    id: 'business',
    slug: 'business',
    name: 'Business',
    description: 'Paperwork that would otherwise need a subscription.',
    icon: Briefcase,
  },
] as const

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((category) => category.slug === slug)
}
