import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: {} }))

import { StreakService } from './StreakService'

interface TxUser {
  streakDays: number
  lastActiveDay: string | null
}

function buildTx(user: TxUser | null) {
  return {
    user: {
      findUnique: vi.fn(async () => user),
      update: vi.fn(async () => undefined)
    }
  }
}

describe('StreakService', () => {
  let service: StreakService

  beforeEach(() => {
    service = new StreakService()
  })

  it('tick_returns_zero_when_user_missing', async () => {
    const tx = buildTx(null)
    const result = await service.tick(faker.string.uuid(), new Date(), tx as never)
    expect(result).toBe(0)
  })

  it('tick_initialises_streak_to_one_when_lastActiveDay_null', async () => {
    const tx = buildTx({ streakDays: 0, lastActiveDay: null })
    const result = await service.tick(
      faker.string.uuid(),
      new Date('2026-04-26T08:00:00Z'),
      tx as never
    )
    expect(result).toBe(1)
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { streakDays: 1, lastActiveDay: '2026-04-26' } })
    )
  })

  it('tick_increments_when_yesterday', async () => {
    const tx = buildTx({ streakDays: 5, lastActiveDay: '2026-04-25' })
    const result = await service.tick(
      faker.string.uuid(),
      new Date('2026-04-26T08:00:00Z'),
      tx as never
    )
    expect(result).toBe(6)
  })

  it('tick_resets_to_one_on_two_day_gap', async () => {
    const tx = buildTx({ streakDays: 5, lastActiveDay: '2026-04-24' })
    const result = await service.tick(
      faker.string.uuid(),
      new Date('2026-04-26T08:00:00Z'),
      tx as never
    )
    expect(result).toBe(1)
  })

  it('tick_is_noop_when_same_day', async () => {
    const tx = buildTx({ streakDays: 7, lastActiveDay: '2026-04-26' })
    const result = await service.tick(
      faker.string.uuid(),
      new Date('2026-04-26T18:00:00Z'),
      tx as never
    )
    expect(result).toBe(7)
    expect(tx.user.update).not.toHaveBeenCalled()
  })
})
