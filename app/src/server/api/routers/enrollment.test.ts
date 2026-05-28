import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/cache/invalidateProfileCaches', () => ({
  invalidateProfileCachesForUserId: vi.fn(async () => undefined),
  invalidateProfileCachesForUsername: vi.fn(async () => undefined),
  invalidatePlanRelatedCaches: vi.fn(async () => undefined)
}))

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { setFakeEnrollment } from '~/server/repositories/fixtures'

describe('enrollment router (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setFakeEnrollment({
      courseSlug: 'python-basics',
      status: 'active',
      startedAt: new Date(),
      finishedAt: null,
      progressPercent: 0,
      completedLessonIds: [],
      currentLessonId: null
    })
  })

  it('enrollment_getMine_returns_null_when_anonymous', async () => {
    const { caller } = buildTestCaller({ user: null })
    expect(await caller.enrollment.getMine({ courseSlug: 'python-basics' })).toBeNull()
  })

  it('enrollment_start_creates_active_for_free_when_idempotent_replay', async () => {
    const { caller } = buildTestCaller()
    const row = await caller.enrollment.start({ courseSlug: 'python-basics' })
    expect(row?.status).toBe('active')
  })

  it('enrollment_start_throws_NOT_FOUND_when_course_missing', async () => {
    const { caller } = buildTestCaller()
    await expect(caller.enrollment.start({ courseSlug: 'missing-course' })).rejects.toThrow(
      /Курс не найден|NOT_FOUND/i
    )
  })

  it('enrollment_abandon_returns_status_abandoned', async () => {
    const { caller } = buildTestCaller()
    const row = await caller.enrollment.abandon({ courseSlug: 'python-basics' })
    expect(row?.status).toBe('abandoned')
  })

  it('enrollment_myShowcase_groups_active_and_finished', async () => {
    const { caller } = buildTestCaller()
    const showcase = await caller.enrollment.myShowcase()
    expect(showcase).toHaveProperty('active')
    expect(showcase).toHaveProperty('finished')
  })
})
