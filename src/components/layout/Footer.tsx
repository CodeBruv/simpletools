import { Link } from 'react-router-dom'

import Logo from '@/components/layout/Logo'
import PageContainer from '@/components/layout/PageContainer'
import { CATEGORIES_PATH, TOOLS_PATH } from '@/lib/paths'

const LINKS = [
  { to: TOOLS_PATH, label: 'All tools' },
  { to: CATEGORIES_PATH, label: 'Categories' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/contact', label: 'Contact' },
] as const

export default function Footer() {
  return (
    <footer data-print="hide" className="mt-20 border-t border-line">
      <PageContainer className="py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo asLink={false} />
            <p className="mt-2 max-w-xs text-sm text-muted">
              Free tools for everyday tasks. No account, and your files stay on your device.
            </p>
          </div>

          <nav aria-label="Footer">
            {/* gap-y-0 because each row is already 44px tall; adding vertical
                gap on top of that would stretch the footer on a phone. */}
            <ul className="flex flex-wrap gap-x-5 text-sm text-muted sm:justify-end">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex min-h-11 items-center rounded hover:text-ink hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-8 text-xs text-faint">
          © {new Date().getFullYear()} SimpleTools
        </p>
      </PageContainer>
    </footer>
  )
}
