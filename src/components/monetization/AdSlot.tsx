import type { CSSProperties } from 'react'

import type { AdPlacement } from '@/components/monetization/adPlacements'
import { AD_PROVIDER_CONFIGURED, AD_SIZES } from '@/components/monetization/adPlacements'
import { cn } from '@/lib/utils'

interface AdSlotProps {
  placement: AdPlacement
  className?: string
}

/**
 * A reserved position for a future advertisement.
 *
 * Today it renders nothing at all. That is the point: the MVP must not carry
 * grey placeholder rectangles, and an unused slot has to collapse rather than
 * leave a gap — so this returns null while `AD_PROVIDER_CONFIGURED` is false,
 * and the surrounding layout uses ordinary flow spacing that closes up behind
 * it.
 *
 * What it buys us is the position. Every page already declares where a unit
 * would go, so introducing one later is a change to this file plus a flag, not
 * a re-layout of every tool. The forbidden positions are visible by their
 * absence: no call site sits between a control and its result, and adding one
 * would mean editing AD_PLACEMENTS, which is reviewable.
 *
 * Deliberately absent: any provider SDK, script tag, iframe or network call.
 * The source audit fails the build if one appears.
 */
export default function AdSlot({ placement, className }: AdSlotProps) {
  if (!AD_PROVIDER_CONFIGURED) return null

  /*
   * Reached only once advertising is switched on. The box reserves its height
   * up front, from the same table the tests read, so a unit cannot shift the
   * page as it loads — the spec's "no unexpected shift after loading" rule.
   *
   * It is a labelled landmark rather than aria-hidden: a screen-reader user is
   * entitled to know a region is promotional. The label also keeps it
   * distinguishable from the tool's own controls, which is what stops the
   * accidental clicks.
   */
  const size = AD_SIZES[placement]

  return (
    <aside
      aria-label="Advertisement"
      data-ad-placement={placement}
      className={cn('ad-slot', className)}
      style={
        {
          '--ad-height-narrow': `${size.narrow}px`,
          '--ad-height-wide': `${size.wide}px`,
        } as CSSProperties
      }
    />
  )
}
