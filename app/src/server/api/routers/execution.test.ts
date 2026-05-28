import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/cache/invalidateProfileCaches', () => ({
  invalidateProfileCachesForUserId: vi.fn(async () => undefined)
}))

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'

describe('execution router (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('execution_run_returns_executionId', async () => {
    const { caller } = buildTestCaller()
    const result = await caller.execution.run({
      taskId: faker.string.uuid(),
      language: 'python',
      code: 'print("ok")',
      mode: 'run',
      context: { kind: 'course', ref: 'python-basics' }
    })
    expect(result.executionId).toMatch(/^exec_/)
  })

  it('execution_get_returns_record_for_owner', async () => {
    const { caller, user } = buildTestCaller()
    const enq = await caller.execution.run({
      taskId: null,
      language: 'python',
      code: 'print("hi")',
      mode: 'run',
      context: { kind: 'sandbox', ref: null }
    })
    expect(user).not.toBeNull()
    const record = await caller.execution.get({ executionId: enq.executionId })
    expect(record.stdout).toBe('hi')
  })

  it('execution_get_throws_NOT_FOUND_for_unknown', async () => {
    const { caller } = buildTestCaller()
    await expect(caller.execution.get({ executionId: 'unknown' })).rejects.toThrow(
      /Запуск не найден|NOT_FOUND/i
    )
  })
})
