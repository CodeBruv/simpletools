import { Link } from 'react-router-dom'

import PageContainer from '@/components/layout/PageContainer'
import AdSlot from '@/components/monetization/AdSlot'
import ToolSearch from '@/components/tools/ToolSearch'
import ToolGrid from '@/components/tools/ToolGrid'
import { CATEGORIES } from '@/data/categories'
import {
  byAvailabilityThenName,
  getAvailableTools,
  getFeaturedTools,
  getToolsByCategory,
} from '@/tools/registry'
import { HOME_PATH, TOOLS_PATH, categoryPath } from '@/lib/paths'
import { usePageMeta } from '@/lib/seo'

export default function Home() {
  usePageMeta({
    title: 'SimpleTools — Free tools for everyday tasks',
    description:
      'A growing collection of fast, free browser tools. Compress images, generate QR codes, build invoices — no account, no uploads, no waiting.',
    path: HOME_PATH,
  })

  const featured = getFeaturedTools().sort(byAvailabilityThenName)
  const availableCount = getAvailableTools().length

  return (
    <>
      <section className="border-b border-line">
        <PageContainer className="py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="eyebrow">
              {availableCount} tool{availableCount === 1 ? '' : 's'} ready · more tools coming
            </span>

            <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-5xl">
              Free tools for
              <br />
              everyday tasks.
            </h1>

            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-muted">
              Small utilities that do one job well and get out of your way. Everything runs in
              your browser, so your files never leave your device.
            </p>

            <div className="mt-8 max-w-xl">
              <ToolSearch variant="hero" placeholder="What do you need to do?" />
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer className="py-14">
        <section aria-labelledby="featured-tools">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="featured-tools" className="text-xl font-semibold text-ink">
              Tools
            </h2>
            <Link to={TOOLS_PATH} className="text-sm text-muted hover:text-ink hover:underline">
              See all
            </Link>
          </div>

          <ToolGrid tools={featured} emphasiseSlug="image-compressor" className="mt-5" />
        </section>

        <section aria-labelledby="browse-categories" className="mt-16">
          <h2 id="browse-categories" className="text-xl font-semibold text-ink">
            Browse by category
          </h2>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              const count = getToolsByCategory(category.id).length

              return (
                <li key={category.id}>
                  <Link
                    to={categoryPath(category.slug)}
                    className="flex h-full items-start gap-3.5 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-paper"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                      <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium text-ink">
                        {category.name}
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                        {category.description}
                      </span>
                      <span className="eyebrow mt-2 block">
                        {count} tool{count === 1 ? '' : 's'}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <AdSlot placement="page-bottom" className="mt-16" />
      </PageContainer>
    </>
  )
}
