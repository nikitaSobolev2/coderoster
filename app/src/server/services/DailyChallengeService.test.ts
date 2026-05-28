import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const upsertMock = vi.fn()
const dailyFindUniqueMock = vi.fn()
const attemptCountMock = vi.fn()

vi.mock('~/server/db', () => ({
  db: {
    dailyChallengeAttempt: {
      upsert: upsertMock,
      count: attemptCountMock
    },
    dailyChallenge: {
      findUnique: dailyFindUniqueMock
    },
    courseTask: {
      findMany: vi.fn(),
      findFirst: vi.fn()
    }
  }
}))

import { DailyChallengeService } from './DailyChallengeService'

describe('DailyChallengeService', () => {
  let service: DailyChallengeService

  beforeEach(() => {
    service = new DailyChallengeService()
    upsertMock.mockReset()
    dailyFindUniqueMock.mockReset()
    attemptCountMock.mockReset()
  })

  it('markSolved_upserts_attempt_with_SUCCESS_status', async () => {
    upsertMock.mockResolvedValueOnce(undefined)
    const userId = faker.string.uuid()
    const taskIndex = faker.number.int({ min: 0, max: 2 })
    await service.markSolved({ userId, date: '2026-04-26', taskIndex })
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_date_taskIndex: { userId, date: '2026-04-26', taskIndex } },
        update: expect.objectContaining({ status: 'SUCCESS' })
      })
    )
  })

  it('markSolved_is_idempotent_via_upsert_on_duplicate', async () => {
    upsertMock.mockResolvedValue(undefined)
    const args = { userId: faker.string.uuid(), date: '2026-04-26', taskIndex: 1 }
    await service.markSolved(args)
    await service.markSolved(args)
    expect(upsertMock).toHaveBeenCalledTimes(2)
  })

  it('hasFullClear_returns_true_when_cleared_equals_task_count', async () => {
    dailyFindUniqueMock.mockResolvedValueOnce({ id: 'd1', _count: { tasks: 3 } })
    attemptCountMock.mockResolvedValueOnce(3)
    expect(await service.hasFullClear(faker.string.uuid(), '2026-04-26')).toBe(true)
  })

  it('hasFullClear_returns_false_when_cleared_short', async () => {
    dailyFindUniqueMock.mockResolvedValueOnce({ id: 'd1', _count: { tasks: 3 } })
    attemptCountMock.mockResolvedValueOnce(2)
    expect(await service.hasFullClear(faker.string.uuid(), '2026-04-26')).toBe(false)
  })

  it('hasFullClear_returns_false_when_challenge_has_zero_tasks', async () => {
    dailyFindUniqueMock.mockResolvedValueOnce({ id: 'd1', _count: { tasks: 0 } })
    expect(await service.hasFullClear(faker.string.uuid(), '2026-04-26')).toBe(false)
  })

  it('hasFullClear_returns_false_when_challenge_missing', async () => {
    dailyFindUniqueMock.mockResolvedValueOnce(null)
    expect(await service.hasFullClear(faker.string.uuid(), '2026-04-26')).toBe(false)
  })
})
