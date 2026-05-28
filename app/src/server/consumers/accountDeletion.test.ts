import { describe, expect, it, vi } from 'vitest'

vi.mock('~/server/amqp/consumer', () => ({
  startConsumer: vi.fn(async () => undefined)
}))
vi.mock('~/server/cache', () => ({
  cache: { delPrefix: vi.fn(async () => undefined) }
}))
vi.mock('~/server/services/AccountDeletionService', () => ({
  accountDeletionService: { delete: vi.fn(async () => ({ workosUserId: 'wk1' })) }
}))

import { runAccountDeletionConsumer } from './accountDeletion'

describe('accountDeletion consumer (module surface)', () => {
  it('runAccountDeletionConsumer_resolves_without_error', async () => {
    await expect(runAccountDeletionConsumer()).resolves.toBeUndefined()
  })
})
