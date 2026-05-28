import { beforeEach, describe, expect, it, vi } from 'vitest'

const { checkMock } = vi.hoisted(() => ({
  checkMock: vi.fn()
}))

vi.mock('~/server/rateLimit', () => ({
  RateLimiter: vi.fn().mockImplementation(() => ({ check: checkMock }))
}))

vi.mock('~/server/cache/invalidateProfileCaches', () => ({
  invalidateProfileCachesForUserId: vi.fn(async () => undefined),
  invalidateProfileCachesForUsername: vi.fn(async () => undefined),
  invalidatePlanRelatedCaches: vi.fn(async () => undefined)
}))

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'

describe('rate limit middleware (integration via execution.run)', () => {
  beforeEach(() => {
    checkMock.mockReset()
  })

  it('rate_limit_allows_under_limit', async () => {
    checkMock.mockResolvedValue({ allowed: true, remaining: 9, retryAfterSeconds: 60 })
    const { caller } = buildTestCaller()
    const result = await caller.execution.run({
      taskId: null,
      language: 'python',
      code: 'print(1)',
      mode: 'run',
      context: { kind: 'sandbox', ref: null }
    })
    expect(result.executionId).toMatch(/^exec_/)
  })

  it('rate_limit_throws_TOO_MANY_REQUESTS_when_exceeded', async () => {
    checkMock.mockResolvedValue({ allowed: false, remaining: 0, retryAfterSeconds: 30 })
    const { caller } = buildTestCaller()
    await expect(
      caller.execution.run({
        taskId: null,
        language: 'python',
        code: 'print(1)',
        mode: 'run',
        context: { kind: 'sandbox', ref: null }
      })
    ).rejects.toThrow(/Слишком|TOO_MANY/i)
  })

  it('rate_limit_uses_user_id_identity_for_authenticated_caller', async () => {
    checkMock.mockResolvedValue({ allowed: true, remaining: 9, retryAfterSeconds: 60 })
    const { caller, user } = buildTestCaller()
    await caller.execution.run({
      taskId: null,
      language: 'python',
      code: 'print(1)',
      mode: 'run',
      context: { kind: 'sandbox', ref: null }
    })
    expect(checkMock).toHaveBeenCalledWith(`user:${user!.id}`)
  })
})
