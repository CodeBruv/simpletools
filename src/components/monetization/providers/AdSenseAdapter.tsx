import { useEffect, useRef } from 'react'

import { ADSENSE_CLIENT, ADSENSE_SLOTS } from '@/components/monetization/adConfig'
import type { AdPlacement } from '@/components/monetization/adPlacements'
import type { AdProviderAdapterProps } from '@/components/monetization/adResolver'

const AVAILABILITY_TIMEOUT_MS = 10_000

export function AdSenseAdapter({
  placement,
  onAvailabilityChange,
}: AdProviderAdapterProps) {
  const adRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    const ad = adRef.current
    if (!ad) return

    let settled = false
    const reportAvailability = () => {
      if (settled) return

      const status = ad.getAttribute('data-ad-status')
      if (status === 'filled') {
        settled = true
        onAvailabilityChange(true)
      }
      if (status === 'unfilled') {
        settled = true
        onAvailabilityChange(false)
      }
    }

    const observer = new MutationObserver(reportAvailability)
    observer.observe(ad, {
      attributes: true,
      attributeFilter: ['data-ad-status'],
    })

    reportAvailability()
    const timeout = window.setTimeout(() => {
      if (!settled) {
        settled = true
        onAvailabilityChange(false)
      }
    }, AVAILABILITY_TIMEOUT_MS)

    try {
      if (ad.getAttribute('data-adsbygoogle-status') !== 'done') {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (error) {
      settled = true
      onAvailabilityChange(false)
      console.error('Ad provider error:', error)
    }

    return () => {
      window.clearTimeout(timeout)
      observer.disconnect()
    }
  }, [onAvailabilityChange, placement])

  return (
    <ins
      ref={adRef}
      className="adsbygoogle ad-provider-content"
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={ADSENSE_SLOTS[placement]}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}

// The descriptor stays beside its component so provider wiring remains isolated.
// eslint-disable-next-line react-refresh/only-export-components
export const ADSENSE_ADAPTER = {
  id: 'adsense',
  supportsPlacement: (placement: AdPlacement) => Boolean(ADSENSE_SLOTS[placement]),
  Component: AdSenseAdapter,
}
