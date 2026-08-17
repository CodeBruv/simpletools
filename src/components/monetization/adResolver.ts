import type { ComponentType } from 'react'

import { ACTIVE_AD_PROVIDER } from '@/components/monetization/adConfig'
import type { AdPlacement } from '@/components/monetization/adPlacements'
import { ADSENSE_ADAPTER } from '@/components/monetization/providers/AdSenseAdapter'

export interface AdProviderAdapterProps {
  placement: AdPlacement
  onAvailabilityChange: (available: boolean) => void
}

export interface AdProviderAdapter {
  id: string
  supportsPlacement: (placement: AdPlacement) => boolean
  Component: ComponentType<AdProviderAdapterProps>
}

const AD_PROVIDER_REGISTRY = {
  adsense: ADSENSE_ADAPTER,
} satisfies Record<string, AdProviderAdapter>

export function resolveAdProvider(placement: AdPlacement): AdProviderAdapter | null {
  if (!ACTIVE_AD_PROVIDER) return null

  const provider = AD_PROVIDER_REGISTRY[ACTIVE_AD_PROVIDER]
  if (!provider?.supportsPlacement(placement)) return null

  return provider
}
