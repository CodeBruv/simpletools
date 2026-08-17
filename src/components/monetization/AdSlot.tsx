import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import {
  AD_SIZES,
  type AdPlacement,
} from '@/components/monetization/adPlacements'
import { resolveAdProvider } from '@/components/monetization/adResolver'
import { cn } from '@/lib/utils'

interface AdSlotProps {
  placement: AdPlacement
  className?: string
}

export default function AdSlot({ placement, className }: AdSlotProps) {
  const provider = resolveAdProvider(placement)
  const [available, setAvailable] = useState<boolean | null>(null)
  const slotRef = useRef<HTMLElement>(null)
  const handleAvailabilityChange = useCallback((nextAvailable: boolean) => {
    setAvailable(nextAvailable)
  }, [])

  useEffect(() => {
    const slot = slotRef.current
    if (!slot || !provider || available !== true) return

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

    return () => observer.disconnect()
  }, [available, provider])

  if (!provider || available === false) return null

  const ProviderComponent = provider.Component
  const slotIsActive = available === true

  return (
    <aside
      ref={slotRef}
      aria-label={slotIsActive ? 'Advertisement' : undefined}
      aria-hidden={!slotIsActive}
      data-ad-placement={placement}
      data-ad-provider={provider.id}
      className={slotIsActive ? cn('ad-slot', className) : undefined}
      style={
        slotIsActive
          ? ({
              '--ad-height-narrow': `${AD_SIZES[placement].narrow}px`,
              '--ad-height-wide': `${AD_SIZES[placement].wide}px`,
            } as CSSProperties)
          : {
              height: 0,
              minHeight: 0,
              maxHeight: 0,
              margin: 0,
              padding: 0,
              overflow: 'hidden',
            }
      }
    >
      <ProviderComponent
        placement={placement}
        onAvailabilityChange={handleAvailabilityChange}
      />
    </aside>
  )
}