/**
 * The SimpleTools mark: a single capital S drawn as one continuous circuit
 * trace, sitting inside an outlined rounded square.
 *
 * The geometry is a vectorisation of the approved brand reference, normalised
 * onto a 32-unit grid: container stroke 2.2 and outer corner radius 3.7 (the
 * reference's 8/117 and 13.5/117 ratios), hairpin radius 5, bar centrelines on
 * y 6/16/26, terminal node dots at r 1.9, and half-weight circuit stubs along
 * the inner edge of each hairpin at a 2.0 pitch. The lower hairpin's stubs are
 * the upper set rotated 180 degrees about the centre, so the mark is
 * rotationally symmetric.
 *
 * This component is the single source of truth for the mark inside the app. The
 * only other copies are the two static assets that cannot import it,
 * public/favicon.svg and public/og-default.png; both carry the same path data
 * and must be regenerated if this file changes.
 *
 * Colour comes from currentColor, so the accent token of the active theme
 * applies and no separate dark-mode artwork is needed. The same artwork is used
 * at every size -- there is no simplified small variant.
 */

/** The S: top bar, left hairpin, middle bar, right hairpin, bottom bar. */
const TRACE = 'M23.4 6H12.6A5 5 0 0 0 12.6 16H19.4A5 5 0 0 1 19.4 26H8.6'

/** Circuit stubs, lining the inner edge of both hairpins. */
const STUBS =
  'M15.9 6v1.9M13.9 6v1.9M11.71 6.08L12.05 7.95M9.41 7.15L10.62 8.61M7.93 9.21L9.7 9.89M7.65 11.73L9.53 11.45M8.65 14.07L10.15 12.9M10.66 15.61L11.4 13.86M13.05 16v-1.9M15.05 16v-1.9M16.1 26v-1.9M18.1 26v-1.9M20.29 25.92L19.95 24.05M22.59 24.85L21.38 23.39M24.07 22.79L22.3 22.11M24.35 20.27L22.47 20.55M23.35 17.93L21.85 19.1M21.34 16.39L20.6 18.14M18.95 16v1.9M16.95 16v1.9'

interface BrandMarkProps {
  /**
   * Size and colour are supplied by the call site. There is deliberately no
   * default size class, because `cn` does not resolve Tailwind conflicts and a
   * default would not be overridable.
   */
  className?: string
}

export default function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1.1" y="1.1" width="29.8" height="29.8" rx="2.6" strokeWidth="2.2" />
      <path d={TRACE} strokeWidth="2.2" />
      <path d={STUBS} strokeWidth="1.1" />
      <circle cx="23.4" cy="6" r="1.9" fill="currentColor" stroke="none" />
      <circle cx="8.6" cy="26" r="1.9" fill="currentColor" stroke="none" />
    </svg>
  )
}
