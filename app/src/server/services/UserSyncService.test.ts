import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const userFindUniqueMock = vi.fn()
const userCreateMock = vi.fn()
const userUpdateMock = vi.fn()
const planFindFirstMock = vi.fn()
const isBootstrapAdminEmailMock = vi.fn()

vi.mock('~/server/db', () => ({
  db: {
    user: {
      findUnique: userFindUniqueMock,
      create: userCreateMock,
      update: userUpdateMock
    },
    plan: { findFirst: planFindFirstMock }
  }
}))

vi.mock('~/server/auth/bootstrapAdminEmail', () => ({
  isBootstrapAdminEmail: (...args: unknown[]) => isBootstrapAdminEmailMock(...args)
}))

import { UserSyncService } from './UserSyncService'

describe('UserSyncService', () => {
  let service: UserSyncService

  beforeEach(() => {
    service = new UserSyncService()
    userFindUniqueMock.mockReset()
    userCreateMock.mockReset()
    userUpdateMock.mockReset()
    planFindFirstMock.mockReset()
    isBootstrapAdminEmailMock.mockReset()
    isBootstrapAdminEmailMock.mockReturnValue(false)
    planFindFirstMock.mockResolvedValue({ id: 'free-plan' })
  })

  it('syncFromSession_creates_user_when_unknown_workosUserId', async () => {
    userFindUniqueMock
      .mockResolvedValueOnce(null) // initial workos lookup
      .mockResolvedValueOnce(null) // username uniqueness check
    userCreateMock.mockResolvedValueOnce({ id: 'u1' })
    const email = faker.internet.email()
    await service.syncFromSession({
      id: 'wk1',
      email,
      firstName: 'A',
      lastName: 'B',
      profilePictureUrl: null
    })
    expect(userCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ workosUserId: 'wk1', email, role: 'LEARNER' })
      })
    )
  })

  it('syncFromSession_assigns_ADMIN_when_bootstrap_email_matches', async () => {
    isBootstrapAdminEmailMock.mockReturnValueOnce(true)
    userFindUniqueMock.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    userCreateMock.mockResolvedValueOnce({ id: 'u1' })
    await service.syncFromSession({
      id: 'wk1',
      email: 'admin@coderoster.dev',
      firstName: null,
      lastName: null,
      profilePictureUrl: null
    })
    expect(userCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'ADMIN' })
      })
    )
  })

  it('syncFromSession_returns_existing_user_without_create', async () => {
    const existing = { id: 'u1', personalDataProcessingConsentAt: new Date() }
    userFindUniqueMock.mockResolvedValueOnce(existing)
    const result = await service.syncFromSession({
      id: 'wk1',
      email: faker.internet.email(),
      firstName: null,
      lastName: null,
      profilePictureUrl: null
    })
    expect(result).toBe(existing)
    expect(userCreateMock).not.toHaveBeenCalled()
  })

  it('syncFromSession_backfills_personalDataProcessingConsentAt_when_missing', async () => {
    const existing = { id: 'u1', personalDataProcessingConsentAt: null }
    userFindUniqueMock.mockResolvedValueOnce(existing)
    userUpdateMock.mockResolvedValueOnce({ id: 'u1' })
    const consentAt = new Date()
    await service.syncFromSession(
      { id: 'wk1', email: 'a@b.co', firstName: null, lastName: null, profilePictureUrl: null },
      { personalDataProcessingConsentAt: consentAt }
    )
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { personalDataProcessingConsentAt: consentAt }
    })
  })

  it('invalidate_is_a_noop_and_does_not_throw', async () => {
    await expect(service.invalidate('wk1')).resolves.toBeUndefined()
  })
})
