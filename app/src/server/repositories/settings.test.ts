import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: {} }))
vi.mock('~/server/auth/bootstrapAdminEmail', () => ({
  isBootstrapAdminEmail: (email: string) => email === 'admin@coderoster.dev'
}))

import { FakeSettingsRepository } from './settings.repository'

describe('FakeSettingsRepository', () => {
  let repo: FakeSettingsRepository
  const userId = faker.string.uuid()

  beforeEach(() => {
    repo = new FakeSettingsRepository()
  })

  it('getMine_returns_seed_user', async () => {
    const settings = await repo.getMine(userId)
    expect(settings.username).toBe('codenikita')
  })

  it('update_changes_displayName_and_returns_full_settings', async () => {
    const newName = faker.person.fullName()
    const settings = await repo.update(userId, { displayName: newName })
    expect(settings.displayName).toBe(newName)
  })

  it('update_merges_socials_without_dropping_existing', async () => {
    await repo.update(userId, { socials: { github: 'https://github.com/x' } })
    const settings = await repo.update(userId, { socials: { linkedin: 'https://lnkd.in/y' } })
    expect(settings.socials.github).toBe('https://github.com/x')
    expect(settings.socials.linkedin).toBe('https://lnkd.in/y')
  })

  it('update_merges_appearance_colorScheme', async () => {
    const settings = await repo.update(userId, { appearance: { colorScheme: 'light' } })
    expect(settings.appearance.colorScheme).toBe('light')
  })

  it('updatePlatformRole_updates_role', async () => {
    const settings = await repo.updatePlatformRole(userId, 'admin')
    expect(settings.role).toBe('admin')
  })

  it('allowSelfRoleChange_false_for_non_bootstrap_seed_email', async () => {
    const settings = await repo.getMine(userId)
    expect(settings.allowSelfRoleChange).toBe(false)
  })
})
