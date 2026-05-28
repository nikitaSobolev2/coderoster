import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const userFindManyMock = vi.fn()
const attemptGroupByMock = vi.fn()
const enrollmentFindManyMock = vi.fn()

vi.mock('~/server/db', () => ({
  db: {
    user: { findMany: userFindManyMock },
    courseTaskAttempt: { groupBy: attemptGroupByMock },
    enrollment: { findMany: enrollmentFindManyMock }
  }
}))

vi.mock('~/server/cache', () => ({
  cache: {
    wrap: async (_key: string, _ttl: number, loader: () => Promise<unknown>) => loader()
  }
}))

import { LeaderboardService } from './LeaderboardService'

function buildUsers(count: number) {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    username: faker.internet.username(),
    displayName: faker.person.fullName(),
    avatarUrl: null,
    totalXp: faker.number.int({ min: 0, max: 5000 }),
    _count: { taskAttempts: faker.number.int({ min: 0, max: 100 }) }
  }))
}

describe('LeaderboardService', () => {
  let service: LeaderboardService

  beforeEach(() => {
    service = new LeaderboardService()
    userFindManyMock.mockReset()
    attemptGroupByMock.mockReset()
    enrollmentFindManyMock.mockReset()
  })

  it('leaderboard_returns_top_n_sorted_desc_by_xp', async () => {
    const users = buildUsers(3).sort((a, b) => b.totalXp - a.totalXp)
    userFindManyMock.mockResolvedValueOnce(users)
    const result = await service.global({ window: 'allTime', language: 'all', limit: 3 })
    expect(result.map(r => r.userId)).toEqual(users.map(u => u.id))
    expect(result[0]?.rank).toBe(1)
  })

  it('leaderboard_excludes_users_with_deletionRequestedAt_via_where_clause', async () => {
    userFindManyMock.mockResolvedValueOnce([])
    await service.global({ window: 'allTime', language: 'all' })
    expect(userFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletionRequestedAt: null } })
    )
  })

  it('leaderboard_per_course_filters_to_enrolled_users', async () => {
    enrollmentFindManyMock.mockResolvedValueOnce([
      {
        progressPercent: 80,
        user: {
          id: 'u1',
          username: 'u1',
          displayName: 'User One',
          avatarUrl: null,
          totalXp: 0,
          _count: { taskAttempts: 5 }
        }
      }
    ])
    const result = await service.byCourse({ courseSlug: 'python-basics', window: 'allTime' })
    expect(result).toHaveLength(1)
    expect(result[0]?.username).toBe('u1')
  })

  it('leaderboard_per_window_uses_group_by_when_not_allTime_or_filtered_language', async () => {
    attemptGroupByMock.mockResolvedValueOnce([{ userId: 'u1', _count: { _all: 10 } }])
    userFindManyMock.mockResolvedValueOnce([
      {
        id: 'u1',
        username: 'u1',
        displayName: 'U1',
        avatarUrl: null,
        totalXp: 0
      }
    ])
    const result = await service.global({ window: 'week', language: 'all' })
    expect(result).toHaveLength(1)
    expect(result[0]?.tasksSolved).toBe(10)
  })
})
