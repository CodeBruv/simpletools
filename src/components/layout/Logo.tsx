import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { HOME_PATH } from '@/lib/paths'

interface LogoProps {
  className?: string
  /** Renders as plain markup instead of a link (for use inside the footer). */
  asLink?: boolean
}

function Mark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-7 shrink-0 place-items-center rounded-[7px] bg-accent text-on-accent"
    >
      <svg viewBox="0 0 32 32" className="size-5">
        <path
          d="M9 22.5V9.5M9 9.5h5.2a3.4 3.4 0 0 1 0 6.8H9M20 9.5v13M17 22.5h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export default function Logo({ className, asLink = true }: LogoProps) {
  const content = (
    <>
      <Mark />
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
