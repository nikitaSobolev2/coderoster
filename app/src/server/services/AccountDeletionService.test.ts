import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findUniqueMock, deleteMock, invalidateMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  deleteMock: vi.fn(),
  invalidateMock: vi.fn(async () => undefined)
}))

vi.mock('~/server/db', () => ({
  db: {
    user: {
      findUnique: findUniqueMock,
      delete: deleteMock
    }
  }
}))

vi.mock('./UserSyncService', () => ({
  userSyncService: { invalidate: invalidateMock }
}))

import { AccountDeletionService } from './AccountDeletionService'

describe('AccountDeletionService', () => {
  let service: AccountDeletionService

  beforeEach(() => {
    service = new AccountDeletionService()
    findUniqueMock.mockReset()
    deleteMock.mockReset()
    invalidateMock.mockReset()
  })

  it('delete_drops_user_row_and_invalidates_sync_cache', async () => {
    findUniqueMock.mockResolvedValueOnce({ id: 'u1', workosUserId: 'wk1' })
    deleteMock.mockResolvedValueOnce(undefined)
    const { workosUserId } = await service.delete('u1')
    expect(workosUserId).toBe('wk1')
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 'u1' } })
    expect(invalidateMock).toHaveBeenCalledWith('wk1')
  })

  it('delete_is_idempotent_for_already_deleted_user', async () => {
    findUniqueMock.mockResolvedValueOnce(null)
    const result = await service.delete(faker.string.uuid())
    expect(result.workosUserId).toBeNull()
    expect(deleteMock).not.toHaveBeenCalled()
  })
})
