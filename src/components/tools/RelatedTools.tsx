import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { getRelatedTools, getToolCategory } from '@/tools/registry'
import ToolGrid from '@/components/tools/ToolGrid'
import { categoryPath } from '@/lib/paths'

/**
 * Where to go after finishing a tool.
 *
 * Two levels, both read from the registry: a short set of specific tools, and
 * one link out to the whole owning category. The category link is the part that
 * scales — three cards stay useful when the warehouse holds three hundred
 * tools, whereas a longer list would just become another index.
 *
 * The heading is phrased as a question rather than labelled "Other tools",
 * because at this point in the page the user has their file and is deciding
 * what to do next; a question answers that, a noun does not.
 */
export default function RelatedTools({ slug }: { slug: string }) {
  const related = getRelatedTools(slug)
  const category = getToolCategory(slug)

  if (related.length === 0 && !category) return null

  return (
    <section aria-labelledby="related-tools" className="mt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="related-tools" className="text-lg font-semibold text-ink">
          What next?
        </h2>

        {category && (
          <Link
            to={categoryPath(category.slug)}
            className="group inline-flex min-h-11 items-center gap-1.5 rounded text-[15px] font-medium text-accent hover:underline"
          >
            Explore {category.name}
            <ArrowRight
              className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
              strokeWidth={2}
              aria-hidden="true"
            />
          </Link>
        )}
      </div>

      {related.length > 0 && <ToolGrid tools={related} className="mt-4" />}
    </section>
  )
}
