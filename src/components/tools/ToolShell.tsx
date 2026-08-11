import type { ReactNode } from 'react'

import type { Tool } from '@/tools/registry'
import PageContainer from '@/components/layout/PageContainer'
import ToolHeader from '@/components/tools/ToolHeader'
import RelatedTools from '@/components/tools/RelatedTools'
import AdSlot from '@/components/monetization/AdSlot'

export interface FaqItem {
  question: string
  answer: string
}

interface ToolShellProps {
  tool: Tool
  /** The tool's own controls. Consistency comes from the shell, not from here. */
  children: ReactNode
  /** Optional prose below the tool: how it works, what to expect. */
  help?: ReactNode
  faq?: readonly FaqItem[]
}

/**
 * Shared structure for every tool page.
 *
 * The order is the product decision, and it is enforced here rather than left
 * to each tool:
 *
 *   header → breadcrumb → title → description → [ad] → tool → result
 *     → [ad] → where to go next → helpful prose → FAQ → [ad] → footer
 *
 * Two things about that order are deliberate. Nothing is allowed between the
 * tool's controls and its result — `children` is a single uninterrupted block,
 * so a tool's input, action and completion state stay adjacent no matter what
 * the shell later grows. And onward navigation sits *above* the help and FAQ
 * prose: someone who just downloaded a file wants somewhere to go, not
 * reference material, and the reference material is for people who are stuck
 * — who will scroll for it.
 *
 * Tools supply their own UI and never re-implement page furniture or a second
 * H1.
 *
 * `data-print="hide"` marks the page furniture as application rather than
 * document. A tool that produces something printable declares a
 * `.print-document` region, and everything marked here drops away when it is
 * printed — see the print block in globals.css. Tools that print nothing are
 * unaffected.
 */
export default function ToolShell({ tool, children, help, faq }: ToolShellProps) {
  return (
    <PageContainer className="py-8 sm:py-12">
      <div data-print="hide">
        <ToolHeader tool={tool} />
      </div>

      {/*
        Above the tool, never inside it. The user has read the title and
        description but has not started work, so this is the one point on the
        page where a unit cannot come between an action and its result.
      */}
      <AdSlot placement="tool-top" className="mt-8" />

      <div className="mt-8">{children}</div>

      {/*
        Past the finish line. The user has their file before this is reached,
        and it sits one clear band away from the download button rather than
        tight under it — a unit directly below the primary action is the
        accidental-tap case.
      */}
      <AdSlot placement="tool-bottom" className="mt-16" />

      <div data-print="hide">
        <RelatedTools slug={tool.slug} />
      </div>

      {help && (
        <section aria-labelledby="tool-help" className="mt-16 max-w-2xl" data-print="hide">
          <h2 id="tool-help" className="text-lg font-semibold text-ink">
            How it works
          </h2>
          <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted">{help}</div>
        </section>
      )}

      {faq && faq.length > 0 && (
        <section aria-labelledby="tool-faq" className="mt-14 max-w-2xl" data-print="hide">
          <h2 id="tool-faq" className="text-lg font-semibold text-ink">
            Questions
          </h2>
          <dl className="mt-4 divide-y divide-line border-t border-line">
            {faq.map((item) => (
              <div key={item.question} className="py-4">
                <dt className="text-[15px] font-medium text-ink">{item.question}</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-muted">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <AdSlot placement="page-bottom" className="mt-16" />
    </PageContainer>
  )
}
