import { useLocation } from 'react-router-dom'

import PageContainer from '@/components/layout/PageContainer'
import ToolSearch from '@/components/tools/ToolSearch'
import { ButtonLink } from '@/components/ui/Button'
import { usePageMeta } from '@/lib/seo'
import { HOME_PATH, TOOLS_PATH } from '@/lib/paths'

export default function NotFound() {
  const { pathname } = useLocation()

  // noindex suppresses the canonical link: pointing one at an address that
  // isn't real is worse than having none. Without this, a single-page app
  // leaves the previous page's title in the tab after a bad navigation.
  usePageMeta({
    title: 'Page not found | SimpleTools',
    description: 'That page does not exist. Search or browse the full SimpleTools collection.',
    path: pathname,
    noindex: true,
  })

  return (
    <PageContainer width="prose" className="py-20 text-center">
      <span className="eyebrow">404</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink">
        There's nothing at this address
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted">
        The page may have moved, or the tool may not be built yet. Search for what you need, or
        browse everything on offer.
      </p>

      <div className="mx-auto mt-8 max-w-md">
        <ToolSearch variant="hero" placeholder="Search tools…" />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink to={TOOLS_PATH}>Browse all tools</ButtonLink>
        <ButtonLink to={HOME_PATH} variant="secondary">
          Go home
        </ButtonLink>
      </div>
    </PageContainer>
  )
}
