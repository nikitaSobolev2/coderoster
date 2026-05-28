import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: { $transaction: vi.fn() } }))
vi.mock('~/server/cache/invalidateProfileCaches', () => ({
  invalidatePlanRelatedCaches: vi.fn(async () => undefined),
  invalidateProfileCachesForUsername: vi.fn(async () => undefined)
}))
vi.mock('~/server/services/AchievementService', () => ({
  achievementService: { evaluate: vi.fn(async () => []) }
}))
vi.mock('~/env', () => ({ env: { SELF_SERVE_PLANS: true } }))

import { assignDefaultFreePlanWithTx, assignPlanToUserWithTx } from './planSelection'

function buildTx(seed: {
  plan?: { id: string; tierLevel: number } | null
  defaultFree?: { id: string } | null
}) {
  return {
    plan: {
      findUnique: vi.fn(async () => seed.plan ?? null),
      findFirst: vi.fn(async () => seed.defaultFree ?? null)
    },
    user: {
      update: vi.fn(async () => undefined)
    }
  }
}

describe('planSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('assigns_plan_when_tier_zero_and_self_serve_enabled', async () => {
    const tx = buildTx({ plan: { id: 'p1', tierLevel: 0 } })
    const result = await assignPlanToUserWithTx(tx as never, {
      userId: faker.string.uuid(),
      planId: 'p1',
      bypassSelfServeRestriction: false
    })
    expect(result.tierLevel).toBe(0)
  })

  it('throws_NOT_FOUND_when_plan_missing', async () => {
    const tx = buildTx({ plan: null })
    await expect(
      assignPlanToUserWithTx(tx as never, {
        userId: faker.string.uuid(),
        planId: 'unknown',
        bypassSelfServeRestriction: false
      })
    ).rejects.toThrow(/не найден|NOT_FOUND/i)
  })

  it('assignDefaultFreePlanWithTx_throws_when_no_default_free', async () => {
    const tx = buildTx({ defaultFree: null })
    await expect(assignDefaultFreePlanWithTx(tx as never, faker.string.uuid())).rejects.toThrow(
      /Free plan missing|INTERNAL_SERVER_ERROR/i
    )
  })

  it('assignDefaultFreePlanWithTx_calls_underlying_assign_with_default_plan_id', async () => {
    const tx = buildTx({
      defaultFree: { id: 'free-plan' },
      plan: { id: 'free-plan', tierLevel: 0 }
    })
    const result = await assignDefaultFreePlanWithTx(tx as never, faker.string.uuid())
    expect(result.tierLevel).toBe(0)
    expect(tx.user.update).toHaveBeenCalled()
  })
})
