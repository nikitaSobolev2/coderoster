import { faker } from '@faker-js/faker'
import { describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: {} }))

import { AchievementService } from './AchievementService'

interface TxStub {
  achievement: { findUnique: ReturnType<typeof vi.fn> }
  userAchievementTrack: {
    findUnique: ReturnType<typeof vi.fn>
    upsert: ReturnType<typeof vi.fn>
  }
  user: { findUnique: ReturnType<typeof vi.fn> }
  courseTaskAttempt: { count: ReturnType<typeof vi.fn> }
  enrollment: { count: ReturnType<typeof vi.fn> }
  execution: { findMany: ReturnType<typeof vi.fn> }
  userActivity: {
    count: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
  }
}

function buildTx(seed: {
  achievement?: { id: string; slug: string; goal: number } | null
  existing?: { status: 'ACTIVE' | 'SUCCESS'; earnedAt: Date | null } | null
  passedCount?: number
  streakDays?: number
}): TxStub {
  return {
    achievement: {
      findUnique: vi.fn(async () => seed.achievement ?? null)
    },
    userAchievementTrack: {
      findUnique: vi.fn(async () => seed.existing ?? null),
      upsert: vi.fn(async () => undefined)
    },
    user: {
      findUnique: vi.fn(async () => ({ streakDays: seed.streakDays ?? 0 }))
    },
    courseTaskAttempt: {
      count: vi.fn(async () => seed.passedCount ?? 0)
    },
    enrollment: {
      count: vi.fn(async () => 0)
    },
    execution: {
      findMany: vi.fn(async () => [])
    },
    userActivity: {
      count: vi.fn(async () => 0),
      findFirst: vi.fn(async () => null)
    }
  }
}

describe('AchievementService', () => {
  it('evaluate_unlocks_first_steps_on_lesson_passed_when_track_empty', async () => {
    const service = new AchievementService()
    const tx = buildTx({
      achievement: { id: 'a-first', slug: 'first-steps', goal: 1 },
      existing: null,
      passedCount: 1
    })
    const unlocked = await service.evaluate({
      userId: faker.string.uuid(),
      trigger: 'lesson.passed',
      tx: tx as never
    })
    expect(unlocked.some(u => u.slug === 'first-steps')).toBe(true)
  })

  it('evaluate_does_not_unlock_when_existing_track_already_success', async () => {
    const service = new AchievementService()
    const tx = buildTx({
      achievement: { id: 'a-first', slug: 'first-steps', goal: 1 },
      existing: { status: 'SUCCESS', earnedAt: new Date('2026-01-01') },
      passedCount: 5
    })
    const unlocked = await service.evaluate({
      userId: faker.string.uuid(),
      trigger: 'lesson.passed',
      tx: tx as never
    })
    expect(unlocked.find(u => u.slug === 'first-steps')).toBeUndefined()
  })

  it('evaluate_returns_empty_for_unknown_trigger', async () => {
    const service = new AchievementService()
    const tx = buildTx({})
    const result = await service.evaluate({
      userId: faker.string.uuid(),
      trigger: 'plan.assigned',
      tx: tx as never
    })
    expect(Array.isArray(result)).toBe(true)
  })

  it('evaluate_skips_rule_when_achievement_row_missing', async () => {
    const service = new AchievementService()
    const tx = buildTx({ achievement: null })
    const unlocked = await service.evaluate({
      userId: faker.string.uuid(),
      trigger: 'lesson.passed',
      tx: tx as never
    })
    expect(unlocked).toEqual([])
  })
})
