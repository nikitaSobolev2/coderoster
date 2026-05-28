import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'

import { requiredTierForTask } from './planTier'

describe('requiredTierForTask', () => {
  it('requiredTier_returns_course_tier_when_task_not_premium', () => {
    const tier = faker.number.int({ min: 0, max: 3 })
    expect(requiredTierForTask(tier, { isPremium: false, minPlanTier: 0 })).toBe(tier)
  })

  it('requiredTier_returns_max_when_task_premium_higher', () => {
    expect(requiredTierForTask(1, { isPremium: true, minPlanTier: 3 })).toBe(3)
  })

  it('requiredTier_clamps_to_course_when_minPlanTier_smaller', () => {
    expect(requiredTierForTask(2, { isPremium: true, minPlanTier: 1 })).toBe(2)
  })
})
