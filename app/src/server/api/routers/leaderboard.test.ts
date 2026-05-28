import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/services/LeaderboardService', () => ({
  leaderboardService: {
    global: vi.fn(async () => [
      {
        rank: 1,
        userId: 'u1',
        username: 'a',
        displayName: 'A',
        avatarUrl: null,
        xp: 1000,
        tasksSolved: 5
      }
    ]),
    byCourse: vi.fn(async () => [])
  }
}))

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'

describe('leaderboard router (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('leaderboard_global_returns_top_users', async () => {
    const { caller } = buildTestCaller({ user: null })
    const result = await caller.leaderboard.global({ window: 'allTime', language: 'all' })
    expect(result).toHaveLength(1)
    expect(result[0]?.rank).toBe(1)
  })

  it('leaderboard_byCourse_returns_empty_when_no_enrollments', async () => {
    const { caller } = buildTestCaller({ user: null })
    const result = await caller.leaderboard.byCourse({
      courseSlug: 'python-basics',
      window: 'allTime'
    })
    expect(result).toEqual([])
  })
})
