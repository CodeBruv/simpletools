import { Link } from 'react-router-dom'

import BrandMark from '@/components/layout/BrandMark'
import { cn } from '@/lib/utils'
import { HOME_PATH } from '@/lib/paths'

interface LogoProps {
  className?: string
  /** Renders as plain markup instead of a link (for use inside the footer). */
  asLink?: boolean
}

export default function Logo({ className, asLink = true }: LogoProps) {
  const content = (
    <>
      <BrandMark className="size-7 shrink-0 text-accent" />
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
        Simple<span className="text-accent">Tools</span>
      </span>
    </>
  )

  if (!asLink) {
    return <span className={cn('inline-flex items-center gap-2', className)}>{content}</span>
  }

  return (
    <Link
      to={HOME_PATH}
      className={cn('inline-flex items-center gap-2 rounded-md', className)}
      aria-label="SimpleTools home"
    >
      {content}
    </Link>
  )
}
