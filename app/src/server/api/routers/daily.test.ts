import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/services/DailyChallengeService', () => ({
  dailyChallengeService: {
    getOrCreateToday: vi.fn(async () => ({ id: 'd1', date: '2026-04-26' })),
    listTasksFor: vi.fn(async () => [
      { id: 't1', title: 'Task 1', description: '', estimatedMinutes: 15, initialData: {} },
      { id: 't2', title: 'Task 2', description: '', estimatedMinutes: 15, initialData: {} },
      { id: 't3', title: 'Task 3', description: '', estimatedMinutes: 15, initialData: {} }
    ]),
    findTaskAtIndex: vi.fn(async () => ({ id: 't1', title: 'Task 1' })),
    recordExecutionStart: vi.fn(async () => undefined)
  }
}))

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { db } from '~/server/db'

describe('daily router (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(
      db as unknown as { dailyChallengeAttempt: { findMany: ReturnType<typeof vi.fn> } }
    ).dailyChallengeAttempt = {
      findMany: vi.fn(async () => [])
    }
    ;(db as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user = {
      findUnique: vi.fn(async () => ({ streakDays: 3, lastActiveDay: '2026-04-25' }))
    }
  })

  it('daily_getToday_returns_three_tasks', async () => {
    const { caller } = buildTestCaller({ user: null })
    const today = await caller.daily.getToday()
    expect(today.tasks).toHaveLength(3)
    expect(today.date).toBe('2026-04-26')
  })

  it('daily_myStreak_returns_user_streak_days', async () => {
    const { caller } = buildTestCaller()
    const result = await caller.daily.myStreak()
    expect(result.streakDays).toBe(3)
  })

  it('daily_submit_returns_executionId', async () => {
    const { caller } = buildTestCaller()
    const result = await caller.daily.submit({
      taskIndex: 0,
      language: 'python',
      code: 'print("a")'
    })
    expect(result.executionId).toMatch(/^exec_/)
  })
})
