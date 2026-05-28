import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/cache/invalidateProfileCaches', () => ({
  invalidateProfileCachesForUsername: vi.fn(async () => undefined),
  invalidateProfileCachesForUserId: vi.fn(async () => undefined),
  invalidatePlanRelatedCaches: vi.fn(async () => undefined)
}))
vi.mock('~/server/services/UserSyncService', () => ({
  userSyncService: { invalidate: vi.fn(async () => undefined) }
}))
vi.mock('~/server/auth/bootstrapAdminEmail', () => ({
  isBootstrapAdminEmail: (email: string) => email === 'admin@coderoster.dev'
}))

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'

describe('settings router (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('settings_getMine_returns_seed', async () => {
    const { caller } = buildTestCaller()
    const settings = await caller.settings.getMine()
    expect(settings.username).toBe('codenikita')
  })

  it('settings_update_displayName_returns_updated', async () => {
    const { caller } = buildTestCaller()
    const newName = faker.person.fullName()
    const updated = await caller.settings.update({ displayName: newName })
    expect(updated?.displayName).toBe(newName)
  })

  it('settings_update_merges_socials_without_dropping_existing', async () => {
    const { caller } = buildTestCaller()
    await caller.settings.update({ socials: { github: 'https://github.com/x' } })
    const next = await caller.settings.update({ socials: { linkedin: 'https://lnkd.in/y' } })
    expect(next?.socials.github).toBe('https://github.com/x')
    expect(next?.socials.linkedin).toBe('https://lnkd.in/y')
  })
})
