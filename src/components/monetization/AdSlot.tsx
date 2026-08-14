import { useEffect, useRef } from 'react'
import type { AdPlacement } from '@/components/monetization/adPlacements'
import { cn } from '@/lib/utils'

interface AdSlotProps {
  placement: AdPlacement
  className?: string
}

const AD_SLOTS: Record<AdPlacement, string> = {
  'tool-top': '4288532666',
  'tool-bottom': '9868162400',
  'page-bottom': '5282195924',
}

const ADSENSE_CLIENT = 'ca-pub-1769557970758644'

export default function AdSlot({ placement, className }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    try {
      if (adRef.current && adRef.current.getAttribute('data-adsbygoogle-status') !== 'done') {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [])

  return (
    <aside
      aria-label="Advertisement"
      data-ad-placement={placement}
      className={cn('ad-slot', className)}
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