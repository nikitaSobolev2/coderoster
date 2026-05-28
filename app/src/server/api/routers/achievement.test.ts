import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { db } from '~/server/db'

describe('achievement router (integration)', () => {
  beforeEach(() => {
    ;(db as unknown as { achievement: { findMany: ReturnType<typeof vi.fn> } }).achievement = {
      findMany: vi.fn(async () => [
        {
          id: 'a1',
          slug: 'first-steps',
          name: 'First Steps',
          description: 'Pass first lesson',
          icon: 'shoe-prints',
          imageUrl: null,
          category: 'PROGRESSION',
          rarity: 'COMMON',
          hidden: false,
          goal: 1,
          createdAt: new Date()
        }
      ])
    }
    ;(
      db as unknown as { userAchievementTrack: { findMany: ReturnType<typeof vi.fn> } }
    ).userAchievementTrack = {
      findMany: vi.fn(async () => [])
    }
  })

  it('achievement_listAll_returns_all_with_earned_false', async () => {
    const { caller } = buildTestCaller({ user: null })
    const list = await caller.achievement.listAll()
    expect(list.length).toBeGreaterThan(0)
    expect(list.every(a => !a.earned)).toBe(true)
  })

  it('achievement_listMine_returns_progress_with_currentN', async () => {
    const { caller } = buildTestCaller()
    const list = await caller.achievement.listMine()
    expect(list[0]).toHaveProperty('currentN')
    expect(list[0]).toHaveProperty('goal')
  })
})
