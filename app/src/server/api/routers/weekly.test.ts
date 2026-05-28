import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/services/WeeklyChallengeService', () => ({
  weeklyChallengeService: {
    getOrCreateCurrent: vi.fn(async () => ({ id: 'w1', isoWeek: '2026-W17' })),
    listTasksFor: vi.fn(async () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: `t${i}`,
        title: `T${i}`,
        description: '',
        estimatedMinutes: 15,
        initialData: {}
      }))
    ),
    findTaskAtIndex: vi.fn(async () => ({ id: 't0' })),
    recordExecutionStart: vi.fn(async () => undefined)
  },
  computeIsoWeek: () => '2026-W17'
}))

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { db } from '~/server/db'

describe('weekly router (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(
      db as unknown as { weeklyChallengeAttempt: { findMany: ReturnType<typeof vi.fn> } }
    ).weeklyChallengeAttempt = {
      findMany: vi.fn(async () => [])
    }
  })

  it('weekly_getCurrent_returns_five_tasks', async () => {
    const { caller } = buildTestCaller({ user: null })
    const current = await caller.weekly.getCurrent()
    expect(current.tasks).toHaveLength(5)
    expect(current.isoWeek).toBe('2026-W17')
  })

  it('weekly_submit_returns_executionId', async () => {
    const { caller } = buildTestCaller()
    const result = await caller.weekly.submit({
      taskIndex: 0,
      language: 'python',
      code: 'print(1)'
    })
    expect(result.executionId).toMatch(/^exec_/)
  })
})
