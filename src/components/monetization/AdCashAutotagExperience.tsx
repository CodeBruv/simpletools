import { useEffect } from 'react'

import {
  ADCASH_AUTOTAG_ENABLED,
  ADCASH_AUTOTAG_ZONE_ID,
} from '@/components/monetization/adConfig'
import { startAdCashAutotag } from '@/components/monetization/adcashAutotag'

export default function AdCashAutotagExperience() {
  useEffect(() => {
    void startAdCashAutotag({
      enabled: ADCASH_AUTOTAG_ENABLED,
      zoneId: ADCASH_AUTOTAG_ZONE_ID,
    }).catch(() => {
      // Third-party failure must not affect the application shell or tools.
    })
  }, [])

  return null
}
