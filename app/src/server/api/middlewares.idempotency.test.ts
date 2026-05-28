import { beforeEach, describe, expect, it, vi } from 'vitest'

const checkMock = vi.fn(async () => ({ allowed: true, remaining: 9, retryAfterSeconds: 60 }))

vi.mock('~/server/rateLimit', () => ({
  RateLimiter: vi.fn().mockImplementation(() => ({ check: checkMock }))
}))

vi.mock('~/server/cache/invalidateProfileCaches', () => ({
  invalidateProfileCachesForUserId: vi.fn(async () => undefined),
  invalidateProfileCachesForUsername: vi.fn(async () => undefined),
  invalidatePlanRelatedCaches: vi.fn(async () => undefined)
}))

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { db } from '~/server/db'

describe('idempotency middleware (integration via enrollment.start)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('idempotent_first_call_persists_response_via_upsert', async () => {
    const upsertMock = vi.fn(async () => undefined)
    const updateMock = vi.fn(async () => undefined)
    const findUniqueMock = vi.fn(async () => null)
    ;(
      db as unknown as { idempotencyKey: Record<string, ReturnType<typeof vi.fn>> }
    ).idempotencyKey = {
      findUnique: findUniqueMock,
      upsert: upsertMock,
      update: updateMock
    }
    const { caller } = buildTestCaller({
      headers: { 'idempotency-key': '11111111-1111-1111-1111-111111111111' }
    })
    await caller.enrollment.start({ courseSlug: 'python-basics' })
    expect(upsertMock).toHaveBeenCalled()
  })

  it('idempotent_second_call_replays_payload_with_same_key', async () => {
    const persistedResponse = {
      courseSlug: 'python-basics',
      status: 'active',
      startedAt: new Date('2026-04-26T00:00:00Z').toISOString(),
      finishedAt: null,
      progressPercent: 0,
      completedLessonIds: [],
      currentLessonId: null
    }
    ;(
      db as unknown as { idempotencyKey: Record<string, ReturnType<typeof vi.fn>> }
    ).idempotencyKey = {
      findUnique: vi.fn(async () => ({ status: 'COMPLETED', response: persistedResponse })),
      upsert: vi.fn(async () => undefined),
      update: vi.fn(async () => undefined)
    }
    const { caller } = buildTestCaller({
      headers: { 'idempotency-key': 'replay-key' }
    })
    const result = await caller.enrollment.start({ courseSlug: 'python-basics' })
    expect(result).toEqual(persistedResponse)
  })

  it('idempotent_in_progress_throws_CONFLICT', async () => {
    ;(
      db as unknown as { idempotencyKey: Record<string, ReturnType<typeof vi.fn>> }
    ).idempotencyKey = {
      findUnique: vi.fn(async () => ({
        status: 'IN_PROGRESS',
        response: null,
        expiresAt: new Date(Date.now() + 60_000)
      })),
      upsert: vi.fn(async () => undefined),
      update: vi.fn(async () => undefined)
    }
    const { caller } = buildTestCaller({
      headers: { 'idempotency-key': 'still-running' }
    })
    await expect(caller.enrollment.start({ courseSlug: 'python-basics' })).rejects.toThrow(
      /CONFLICT|обрабатывается/i
    )
  })

  it('idempotent_no_header_skips_middleware', async () => {
    const upsertMock = vi.fn()
    ;(
      db as unknown as { idempotencyKey: Record<string, ReturnType<typeof vi.fn>> }
    ).idempotencyKey = {
      findUnique: vi.fn(async () => null),
      upsert: upsertMock,
      update: vi.fn(async () => undefined)
    }
    const { caller } = buildTestCaller()
    await caller.enrollment.start({ courseSlug: 'python-basics' })
    expect(upsertMock).not.toHaveBeenCalled()
  })
})
