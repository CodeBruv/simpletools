import type { AdPlacement } from '@/components/monetization/adPlacements'

export type AdProviderId = 'adsense'

/** Build/deploy-time provider selection. `null` disables monetization entirely. */
export const ACTIVE_AD_PROVIDER: AdProviderId | null = 'adsense'

export const ADSENSE_CLIENT = 'ca-pub-1769557970758644'

/** Independent page-level monetization experience used for the live AdCash test. */
export const ADCASH_AUTOTAG_ENABLED = true
export const ADCASH_AUTOTAG_ZONE_ID = 'idmmf206vi'

export const ADSENSE_SLOTS: Record<AdPlacement, string> = {
  'tool-top': '4288532666',
  'tool-bottom': '9868162400',
  'page-bottom': '5282195924',
}