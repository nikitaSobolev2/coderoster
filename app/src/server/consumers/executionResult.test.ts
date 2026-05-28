import { describe, expect, it, vi } from 'vitest'

vi.mock('~/server/amqp/consumer', () => ({
  startConsumer: vi.fn(async () => undefined)
}))
vi.mock('~/server/cache', () => ({
  cache: { del: vi.fn(), delPrefix: vi.fn(async () => undefined), wrap: vi.fn() }
}))
vi.mock('~/server/cache/invalidateProfileCaches', () => ({
  invalidateProfileCachesForUsername: vi.fn(async () => undefined)
}))

import { runResultConsumer } from './executionResult'

describe('executionResult consumer (module surface)', () => {
  it('runResultConsumer_is_exported_function', () => {
    expect(typeof runResultConsumer).toBe('function')
  })

  it('runResultConsumer_can_be_invoked_without_error', async () => {
    await expect(runResultConsumer()).resolves.toBeUndefined()
  })
})
