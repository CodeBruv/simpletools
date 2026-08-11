import { Link } from 'react-router-dom'

import PageContainer from '@/components/layout/PageContainer'
import Breadcrumb from '@/components/ui/Breadcrumb'
import AdSlot from '@/components/monetization/AdSlot'
import { CATEGORIES } from '@/data/categories'
import { getToolsByCategory } from '@/tools/registry'
import { CATEGORIES_PATH, HOME_PATH, categoryPath } from '@/lib/paths'
import { usePageMeta } from '@/lib/seo'

export default function CategoriesIndex() {
  usePageMeta({
    title: 'Tool Categories | SimpleTools',
    description:
      'Browse SimpleTools by category: images, PDFs and documents, generators, finance and business utilities.',
    path: CATEGORIES_PATH,
  })

  return (
    <PageContainer className="py-8 sm:py-12">
      <Breadcrumb items={[{ label: 'Home', to: HOME_PATH }, { label: 'Categories' }]} />

      <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-ink">Categories</h1>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
        Tools grouped by the kind of job they do.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category) => {
          const Icon = category.icon
          const tools = getToolsByCategory(category.id)
          const ready = tools.filter((tool) => tool.status === 'available').length

          return (
            <li key={category.id}>
              <Link
                to={categoryPath(category.slug)}
                className="flex h-full items-start gap-3.5 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-line-strong hover:bg-paper"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium text-ink">{category.name}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">
                    {category.description}
                  </span>
                  <span className="eyebrow mt-2.5 block">
                    {tools.length} tool{tools.length === 1 ? '' : 's'} · {ready} ready
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      <AdSlot placement="page-bottom" className="mt-16" />
    </PageContainer>
  )
}
