import PageContainer from '@/components/layout/PageContainer'
import Breadcrumb from '@/components/ui/Breadcrumb'
import AdSlot from '@/components/monetization/AdSlot'
import ToolGrid from '@/components/tools/ToolGrid'
import ToolSearch from '@/components/tools/ToolSearch'
import { CATEGORIES } from '@/data/categories'
import { byAvailabilityThenName, getAvailableTools, getToolsByCategory } from '@/tools/registry'
import { usePageMeta } from '@/lib/seo'
import { HOME_PATH, TOOLS_PATH } from '@/lib/paths'

export default function ToolsIndex() {
  const availableCount = getAvailableTools().length

  usePageMeta({
    title: 'All Tools | SimpleTools',
    description:
      'Every SimpleTools utility in one place, grouped by category. Free, no account required, and processed in your browser.',
    path: TOOLS_PATH,
  })

  return (
    <PageContainer className="py-8 sm:py-12">
      <Breadcrumb items={[{ label: 'Home', to: HOME_PATH }, { label: 'Tools' }]} />

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink">All tools</h1>
          {/* Availability is phrased for the person using the site: what they
              can do now, and that more is coming. The registry's own status
              vocabulary stays out of the copy. */}
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {availableCount} {availableCount === 1 ? 'tool' : 'tools'} ready to use across{' '}
            {CATEGORIES.length} categories, free and straight from your browser. More are on the
            way.
          </p>
        </div>
        <div className="w-full lg:max-w-xs">
          <ToolSearch variant="compact" />
        </div>
      </div>

      <div className="mt-10 space-y-12">
        {CATEGORIES.map((category) => {
          const tools = getToolsByCategory(category.id).sort(byAvailabilityThenName)
          if (tools.length === 0) return null

          return (
            <section key={category.id} aria-labelledby={`category-${category.id}`}>
              <h2
                id={`category-${category.id}`}
                className="text-lg font-semibold text-ink"
              >
                {category.name}
              </h2>
              <ToolGrid tools={tools} className="mt-4" />
            </section>
          )
        })}
      </div>

      <AdSlot placement="page-bottom" className="mt-16" />
    </PageContainer>
  )
}
