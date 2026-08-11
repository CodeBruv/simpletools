import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'

import type { Crumb } from '@/lib/paths'

export type { Crumb }

/**
 * Breadcrumb trail. The crumb marked `back` renders with a leading arrow and
 * accent colour, which gives someone arriving from a search result one obvious
 * way up into the warehouse rather than a row of equally weighted links.
 */
export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isLink = Boolean(item.to) && !isLast

          return (
            <Fragment key={`${item.label}-${index}`}>
              <li className={item.back ? 'inline-flex items-center' : undefined}>
                {isLink ? (
                  <Link
                    to={item.to as string}
                    className={
                      item.back
                        ? // 44px tall and padded out to the left edge: this is the
                          // one-tap route back to the warehouse, and on a phone it
                          // is the element most likely to be aimed at with a thumb.
                          '-ml-1.5 inline-flex min-h-11 items-center gap-1 rounded px-1.5 font-medium text-accent hover:underline'
                        : 'inline-flex min-h-11 items-center rounded hover:text-ink hover:underline'
                    }
                  >
                    {item.back && (
                      <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden="true" />
                    )}
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-ink">
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="text-line-strong">
                  <ChevronRight className="size-3.5" strokeWidth={2} />
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
