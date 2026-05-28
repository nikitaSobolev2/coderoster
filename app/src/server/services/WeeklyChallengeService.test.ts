import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { upsertMock, findUniqueMock, countMock } = vi.hoisted(() => ({
  upsertMock: vi.fn(),
  findUniqueMock: vi.fn(),
  countMock: vi.fn()
}))

vi.mock('~/server/db', () => ({
  db: {
    weeklyChallengeAttempt: {
      upsert: upsertMock,
      count: countMock
    },
    weeklyChallenge: {
      findUnique: findUniqueMock
    },
    courseTask: {
      findMany: vi.fn(),
      findFirst: vi.fn()
    }
  }
}))

import { computeIsoWeek, WeeklyChallengeService } from './WeeklyChallengeService'

describe('WeeklyChallengeService', () => {
  let service: WeeklyChallengeService

  beforeEach(() => {
    service = new WeeklyChallengeService()
    upsertMock.mockReset()
    findUniqueMock.mockReset()
    countMock.mockReset()
  })

  it('markSolved_writes_isoWeek_key_via_upsert', async () => {
    upsertMock.mockResolvedValue(undefined)
    const isoWeek = faker.helpers.arrayElement(['2026-W17', '2026-W18'])
    await service.markSolved({ userId: faker.string.uuid(), isoWeek, taskIndex: 0 })
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: 'SUCCESS' })
      })
    )
  })

  it('hasFullClear_returns_true_when_5_solved', async () => {
    findUniqueMock.mockResolvedValueOnce({ id: 'w1', _count: { tasks: 5 } })
    countMock.mockResolvedValueOnce(5)
    expect(await service.hasFullClear(faker.string.uuid(), '2026-W17')).toBe(true)
  })

  it('hasFullClear_returns_false_when_short', async () => {
    findUniqueMock.mockResolvedValueOnce({ id: 'w1', _count: { tasks: 5 } })
    countMock.mockResolvedValueOnce(4)
    expect(await service.hasFullClear(faker.string.uuid(), '2026-W17')).toBe(false)
  })

  it('computeIsoWeek_formats_with_W_prefix_and_two_digit_week', () => {
    const week = computeIsoWeek(new Date('2026-04-26T12:00:00Z'))
    expect(week).toMatch(/^\d{4}-W\d{2}$/)
  })
})
