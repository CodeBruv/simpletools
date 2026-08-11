import PageContainer from '@/components/layout/PageContainer'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { usePageMeta } from '@/lib/seo'

type PageKey = 'privacy' | 'terms' | 'contact'

interface StaticContent {
  title: string
  heading: string
  metaDescription: string
  body: React.ReactNode
}

/**
 * The three footer pages. Content is inline rather than fetched: there is no
 * backend and no CMS, and this is the honest amount of machinery three static
 * pages need.
 */
const CONTENT: Record<PageKey, StaticContent> = {
  privacy: {
    title: 'Privacy | SimpleTools',
    heading: 'Privacy',
    metaDescription:
      'How SimpleTools handles your data: files are processed in your browser and are never uploaded to a server.',
    body: (
      <>
        <p>
          SimpleTools runs in your browser. When you use a file tool such as the Image Compressor,
          your file is read into your browser's memory, processed there, and handed back to you as a
          download. It is not uploaded to a SimpleTools server, because there is no SimpleTools
          server that receives files.
        </p>
        <p>
          Nothing you put into a tool is written to local storage, cookies or any other persistent
          store. Closing or reloading the tab discards it.
        </p>
        <p>
          There are no accounts, so there is no account data. The MVP ships without analytics. If
          usage measurement is added later, this page will say what is collected before it is
          switched on.
        </p>
        <p className="text-sm text-faint">
          This is a plain-language summary rather than a legal document. Have it reviewed before
          relying on it commercially.
        </p>
      </>
    ),
  },
  terms: {
    title: 'Terms | SimpleTools',
    heading: 'Terms of use',
    metaDescription: 'The terms that apply when you use the free tools on SimpleTools.',
    body: (
      <>
        <p>
          SimpleTools is provided free and as-is, with no warranty. Check the output before you rely
          on it for anything that matters — particularly compressed images destined for print, and
          any figure that feeds an invoice or a tax return.
        </p>
        <p>
          You keep all rights to the files and text you process. Because processing happens on your
          device, SimpleTools never takes possession of them and claims no licence over them.
        </p>
        <p>Please don't use the tools to process material you don't have the right to process.</p>
        <p className="text-sm text-faint">
          Placeholder terms for the MVP. Replace with reviewed terms before commercial launch.
        </p>
      </>
    ),
  },
  contact: {
    title: 'Contact | SimpleTools',
    heading: 'Contact',
    metaDescription: 'Report a bug or suggest a tool for SimpleTools.',
    body: (
      <>
        <p>
          Found a file that won't compress, a layout that breaks, or a tool you keep wishing
          existed? That feedback is the most useful thing you can send.
        </p>
        <p>
          A contact route isn't wired up yet — doing it properly needs a form endpoint or a real
          mailbox, and neither exists at this stage. Rather than show a form that quietly discards
          what you write, this page says so plainly.
        </p>
        <p className="text-sm text-faint">
          Add a mailto: address or form endpoint here when one is available.
        </p>
      </>
    ),
  },
}

export default function StaticPage({ page }: { page: PageKey }) {
  const content = CONTENT[page]

  usePageMeta({
    title: content.title,
    description: content.metaDescription,
    path: `/${page}`,
  })

  return (
    <PageContainer width="prose" className="py-8 sm:py-12">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: content.heading }]} />

      <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-ink">
        {content.heading}
      </h1>

      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted">{content.body}</div>
    </PageContainer>
  )
}
