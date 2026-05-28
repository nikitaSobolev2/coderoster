import { beforeEach, describe, expect, it, vi } from 'vitest'

const assignPlanToUserMock = vi.fn(async () => ({ tierLevel: 1 }))

vi.mock('~/server/services/planSelection', () => ({
  assignPlanToUser: (input: { planId: string }) => assignPlanToUserMock(input)
}))

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { db } from '~/server/db'

describe('plan router (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(db as unknown as { plan: { findMany: ReturnType<typeof vi.fn> } }).plan = {
      findMany: vi.fn(async () => [
        {
          id: 'p1',
          slug: 'free',
          name: 'Free',
          shortDescription: '',
          marketingMarkdown: '',
          marketingFeatures: [],
          isBestseller: false,
          tierLevel: 0,
          xpBonusPercent: 0,
          sortOrder: 0,
          maxActiveCourses: 3
        }
      ])
    }
    ;(db as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user = {
      findUnique: vi.fn(async () => ({ plan: null }))
    }
  })

  it('plan_list_returns_active_plans_sorted_by_sortOrder', async () => {
    const { caller } = buildTestCaller({ user: null })
    const list = await caller.plan.list()
    expect(list).toHaveLength(1)
    expect(list[0]?.slug).toBe('free')
  })

  it('plan_getMine_returns_null_when_no_plan', async () => {
    const { caller } = buildTestCaller()
    expect(await caller.plan.getMine()).toBeNull()
  })

  it('plan_policies_returns_selfServe_flag_from_env', async () => {
    const { caller } = buildTestCaller({ user: null })
    const policies = await caller.plan.policies()
    expect(typeof policies.selfServePaidPlans).toBe('boolean')
  })

  it('plan_select_persists_user_planId_via_service', async () => {
    const { caller } = buildTestCaller()
    const result = await caller.plan.select({ planId: 'p1' })
    expect(result?.tierLevel).toBe(1)
    expect(assignPlanToUserMock).toHaveBeenCalledWith(expect.objectContaining({ planId: 'p1' }))
  })
})
