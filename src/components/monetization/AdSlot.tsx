import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import {
  AD_SIZES,
  type AdPlacement,
} from '@/components/monetization/adPlacements'
import { AD_SLOTS, ADSENSE_CLIENT } from '@/components/monetization/adConfig'
import { cn } from '@/lib/utils'

interface AdSlotProps {
  placement: AdPlacement
  className?: string
}

export default function AdSlot({ placement, className }: AdSlotProps) {
  const slotRef = useRef<HTMLElement>(null)
  const adRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    const slot = slotRef.current
    if (!slot) return

    const preserveBoundary = () => {
      for (const property of ['min-height', 'max-height']) {
        if (
          slot.style.getPropertyValue(property) !== 'var(--ad-height-current)' ||
          slot.style.getPropertyPriority(property) !== 'important'
        ) {
          slot.style.setProperty(property, 'var(--ad-height-current)', 'important')
        }
      }
    }
    const observer = new MutationObserver(preserveBoundary)
    observer.observe(slot, { attributes: true, attributeFilter: ['style'] })

    preserveBoundary()

    try {
      if (
        adRef.current &&
        adRef.current.getAttribute('data-adsbygoogle-status') !== 'done'
      ) {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <aside
      ref={slotRef}
      aria-label="Advertisement"
      data-ad-placement={placement}
      className={cn('ad-slot', className)}
      style={
        {
          '--ad-height-narrow': `${AD_SIZES[placement].narrow}px`,
          '--ad-height-wide': `${AD_SIZES[placement].wide}px`,
        } as CSSProperties
      }
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={AD_SLOTS[placement]}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  )
}