import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: {} }))

import { PlanService } from './PlanService'

interface CourseRow {
  tierRequired: number
}

interface UserPlanRow {
  plan: { tierLevel?: number; maxActiveCourses?: number | null } | null
}

interface ModuleTaskRow {
  id: string
  isPremium: boolean
  minPlanTier: number
}

interface CourseModuleRow {
  tasks: ModuleTaskRow[]
}

function buildTx(seed: {
  user: UserPlanRow | null
  course?: CourseRow | null
  enrollmentStatus?: 'ACTIVE' | 'FINISHED' | 'ABANDONED' | null
  activeCount?: number
  modules?: CourseModuleRow[]
}) {
  return {
    user: {
      findUnique: vi.fn(async () => seed.user)
    },
    course: {
      findUnique: vi.fn(async () => seed.course ?? null)
    },
    enrollment: {
      findUnique: vi.fn(async () =>
        seed.enrollmentStatus !== null && seed.enrollmentStatus !== undefined
          ? { status: seed.enrollmentStatus }
          : null
      ),
      count: vi.fn(async () => seed.activeCount ?? 0)
    },
    courseTask: {
      findUnique: vi.fn(async () => null)
    },
    courseModule: {
      findMany: vi.fn(async () => seed.modules ?? [])
    }
  }
}

describe('PlanService', () => {
  let service: PlanService

  beforeEach(() => {
    service = new PlanService()
  })

  it('getEffectiveTier_returns_zero_when_user_has_no_plan', async () => {
    const tx = buildTx({ user: { plan: null } })
    expect(await service.getEffectiveTier(faker.string.uuid(), tx as never)).toBe(0)
  })

  it('getEffectiveTier_returns_plan_tierLevel_when_set', async () => {
    const tx = buildTx({ user: { plan: { tierLevel: 2 } } })
    expect(await service.getEffectiveTier(faker.string.uuid(), tx as never)).toBe(2)
  })

  it('canEnrollCourse_true_when_tier_meets_required', async () => {
    const tx = buildTx({
      user: { plan: { tierLevel: 2 } },
      course: { tierRequired: 1 }
    })
    expect(
      await service.canEnrollCourse(faker.string.uuid(), faker.string.uuid(), tx as never)
    ).toBe(true)
  })

  it('canEnrollCourse_false_when_tier_below_required', async () => {
    const tx = buildTx({
      user: { plan: { tierLevel: 0 } },
      course: { tierRequired: 2 }
    })
    expect(
      await service.canEnrollCourse(faker.string.uuid(), faker.string.uuid(), tx as never)
    ).toBe(false)
  })

  it('canEnrollCourse_false_when_course_missing', async () => {
    const tx = buildTx({ user: { plan: { tierLevel: 0 } }, course: null })
    expect(
      await service.canEnrollCourse(faker.string.uuid(), faker.string.uuid(), tx as never)
    ).toBe(false)
  })

  it('assertCanStartOrResume_throws_PLAN_TIER_TOO_LOW', async () => {
    const tx = buildTx({
      user: { plan: { tierLevel: 0 } },
      course: { tierRequired: 2 }
    })
    await expect(
      service.assertCanStartOrResumeEnrollment(
        faker.string.uuid(),
        faker.string.uuid(),
        tx as never
      )
    ).rejects.toThrow('PLAN_TIER_TOO_LOW')
  })

  it('assertCanStartOrResume_throws_ACTIVE_ENROLLMENT_CAP_when_cap_reached', async () => {
    const tx = buildTx({
      user: { plan: { tierLevel: 0, maxActiveCourses: 3 } },
      course: { tierRequired: 0 },
      enrollmentStatus: null,
      activeCount: 3
    })
    await expect(
      service.assertCanStartOrResumeEnrollment(
        faker.string.uuid(),
        faker.string.uuid(),
        tx as never
      )
    ).rejects.toThrow('ACTIVE_ENROLLMENT_CAP')
  })

  it('assertCanStartOrResume_passes_when_already_active', async () => {
    const tx = buildTx({
      user: { plan: { tierLevel: 0 } },
      course: { tierRequired: 0 },
      enrollmentStatus: 'ACTIVE'
    })
    await expect(
      service.assertCanStartOrResumeEnrollment(
        faker.string.uuid(),
        faker.string.uuid(),
        tx as never
      )
    ).resolves.toBeUndefined()
  })

  it('findFirstAccessibleLessonId_returns_first_unlocked', async () => {
    const tx = buildTx({
      user: { plan: { tierLevel: 1 } },
      course: { tierRequired: 0 },
      modules: [
        {
          tasks: [
            { id: 'lock-1', isPremium: true, minPlanTier: 3 },
            { id: 'open-1', isPremium: false, minPlanTier: 0 }
          ]
        }
      ]
    })
    const result = await service.findFirstAccessibleLessonId(
      faker.string.uuid(),
      faker.string.uuid(),
      tx as never
    )
    expect(result).toBe('open-1')
  })

  it('findFirstAccessibleLessonId_returns_null_when_all_locked', async () => {
    const tx = buildTx({
      user: { plan: { tierLevel: 0 } },
      course: { tierRequired: 0 },
      modules: [
        {
          tasks: [
            { id: 'a', isPremium: true, minPlanTier: 5 },
            { id: 'b', isPremium: true, minPlanTier: 5 }
          ]
        }
      ]
    })
    const result = await service.findFirstAccessibleLessonId(
      faker.string.uuid(),
      faker.string.uuid(),
      tx as never
    )
    expect(result).toBeNull()
  })
})
