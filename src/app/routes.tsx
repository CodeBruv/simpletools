import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

import Home from '@/pages/Home'
import ToolsIndex from '@/pages/ToolsIndex'
import ToolPage from '@/pages/ToolPage'
import NotFound from '@/pages/NotFound'

const CategoriesIndex = lazy(() => import('@/pages/CategoriesIndex'))
const CategoryPage = lazy(() => import('@/pages/CategoryPage'))
const StaticPage = lazy(() => import('@/pages/StaticPage'))

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <span className="eyebrow">Loading</span>
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools" element={<ToolsIndex />} />
        <Route path="/tools/:slug" element={<ToolPage />} />
        <Route path="/categories" element={<CategoriesIndex />} />
        <Route path="/categories/:slug" element={<CategoryPage />} />
        <Route path="/privacy" element={<StaticPage page="privacy" />} />
        <Route path="/terms" element={<StaticPage page="terms" />} />
        <Route path="/contact" element={<StaticPage page="contact" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
