import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AppRoutes from '@/app/routes'

/** Client-side navigation should behave like a page load: start at the top. */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <Analytics />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-accent"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  )
}