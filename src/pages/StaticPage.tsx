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

const CONTENT: Record<PageKey, StaticContent> = {
  privacy: {
    title: 'Privacy | SimpleTools',
    heading: 'Privacy',
    metaDescription:
      'Learn how SimpleTools handles your files and information. File tools process your files directly in your browser.',
    body: (
      <>
        <p>
          SimpleTools is built to keep your files on your device. When you use a file tool such as
          Image Compressor, the file is opened and processed in your browser. The result is then
          returned to you for download.
        </p>

        <p>
          Your files are not uploaded to SimpleTools for processing. We do not keep copies of the
          files you open with our tools.
        </p>

        <p>
          SimpleTools does not require an account. We do not use cookies or local storage to keep
          copies of the files you process.
        </p>

        <p>
          SimpleTools currently does not use analytics or advertising trackers. If this changes,
          this page will be updated to explain what information is collected and why.
        </p>

        <p>
          The tools are designed to process information locally in your browser.
        </p>
      </>
    ),
  },

  terms: {
    title: 'Terms of Use | SimpleTools',
    heading: 'Terms of use',
    metaDescription:
      'Read the terms of use for SimpleTools and its free browser based tools.',
    body: (
      <>
        <p>
          SimpleTools provides free tools for everyday tasks. You may use the tools for personal,
          educational, professional and commercial work, provided that your use complies with
          applicable laws and the rights of others.
        </p>

        <p>
          The tools are provided as they are. While we work to make them accurate and reliable,
          results can depend on the information you provide, your browser and the way a tool is
          used. Check important results before relying on them.
        </p>

        <p>
          You remain responsible for the files, text and other information you process with
          SimpleTools. You must have the necessary rights and permission to use that material.
        </p>

        <p>
          SimpleTools does not claim ownership of the files or content you process with its tools.
        </p>

        <p>
          SimpleTools is not a substitute for professional advice. Check calculations, financial
          figures, documents and other important results before using them for decisions that carry
          legal, financial or other significant consequences.
        </p>

        <p>
          We may change, improve or discontinue a tool from time to time. We will make reasonable
          efforts to keep the service available and useful, but we cannot guarantee that every tool
          will always be available or error free.
        </p>
      </>
    ),
  },

  contact: {
    title: 'Contact | SimpleTools',
    heading: 'Contact',
    metaDescription:
      'Contact SimpleTools to report a problem, suggest a tool or share feedback.',
    body: (
      <>
        <p>
          Found a problem with a tool, have an idea for something we should build, or want to tell
          us how SimpleTools could be better? We would like to hear from you.
        </p>

        <h2 className="pt-4 text-lg font-semibold text-ink">
          Report a problem
        </h2>

        <p>
          When reporting a problem, tell us which tool you were using, what you expected to happen
          and what happened instead. If possible, include the browser and device you were using.
        </p>

        <h2 className="pt-4 text-lg font-semibold text-ink">
          Suggest a tool
        </h2>

        <p>
          If there is a small task you regularly need a tool for, send us the idea. Useful
          suggestions help us decide what to build next.
        </p>

        <h2 className="pt-4 text-lg font-semibold text-ink">
          Get in touch
        </h2>

        <p>
          Email us at{' '}
          <a
            href="mailto:hello@simpletools.site"
            className="text-accent underline underline-offset-4"
          >
            hello@simpletools.site
          </a>
          .
        </p>

        <p>
          We read messages about bugs, suggestions, accessibility issues and general feedback.
          Please do not send passwords, payment details or other sensitive information by email.
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

      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted">
        {content.body}
      </div>
    </PageContainer>
  )
}