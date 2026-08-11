import { useParams } from 'react-router-dom'

import PageContainer from '@/components/layout/PageContainer'
import Breadcrumb from '@/components/ui/Breadcrumb'
import AdSlot from '@/components/monetization/AdSlot'
import ToolGrid from '@/components/tools/ToolGrid'
import NotFound from '@/pages/NotFound'
import type { Category } from '@/data/categories'
import { getCategory } from '@/data/categories'
import { byAvailabilityThenName, getToolsByCategory } from '@/tools/registry'
import { usePageMeta } from '@/lib/seo'
import { HOME_PATH, CATEGORIES_PATH, categoryPath } from '@/lib/paths'

export default function CategoryPage() {
  const { slug = '' } = useParams()
  const category = getCategory(slug)

  // An unknown slug is a real 404. Setting metadata here first would win over
  // NotFound's — a parent's effect flushes after its child's — and would
  // publish a canonical URL for an address that does not exist.
  if (!category) return <NotFound />

  return <CategoryView category={category} />
}

function CategoryView({ category }: { category: Category }) {
  usePageMeta({
    title: `${category.name} Tools | SimpleTools`,
    description: category.description,
    path: categoryPath(category.slug),
  })

  const Icon = category.icon
  const tools = getToolsByCategory(category.id).sort(byAvailabilityThenName)
  const availableCount = tools.filter((tool) => tool.status === 'available').length

  return (
    <PageContainer className="py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: 'Home', to: HOME_PATH },
          { label: 'Categories', to: CATEGORIES_PATH },
          { label: category.name },
        ]}
      />

      <div className="mt-6 flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-on-accent">
          <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-3xl">
            {category.name}
          </h1>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{category.description}</p>
        </div>
      </div>

      <section aria-labelledby="category-tools" className="mt-10">
        {/*
          "Available tools" is the heading the spec asks a category page to
          communicate. The count beside it is what a visitor cares about — how
          much of this category they can use right now — stated without the
          registry's internal status words.
        */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id="category-tools" className="text-lg font-semibold text-ink">
            Available tools
          </h2>
          <p className="text-[13px] text-muted">
            {availableCount > 0
              ? `${availableCount} of ${tools.length} ready to use`
              : 'Coming soon'}
          </p>
        </div>

        <ToolGrid tools={tools} className="mt-4" />
      </section>

      <AdSlot placement="page-bottom" className="mt-16" />
    </PageContainer>
  )
}
