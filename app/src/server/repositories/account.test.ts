import { faker } from '@faker-js/faker'
import { describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: {} }))

import { FakeAccountRepository } from './account.repository'

describe('FakeAccountRepository', () => {
  it('requestDeletion_returns_queued_true_with_scheduledAt', async () => {
    const repo = new FakeAccountRepository()
    const result = await repo.requestDeletion(faker.string.uuid())
    expect(result.queued).toBe(true)
    expect(result.scheduledAt).toBeInstanceOf(Date)
  })

  it('requestDeletion_does_not_throw_on_repeat', async () => {
    const repo = new FakeAccountRepository()
    const userId = faker.string.uuid()
    await repo.requestDeletion(userId)
    await expect(repo.requestDeletion(userId)).resolves.toMatchObject({ queued: true })
  })
})
