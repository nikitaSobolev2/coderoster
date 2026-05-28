import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'

import { FakeAdminUsersRepository } from '~/../tests/setup/repositories/fakeAdmin'

describe('FakeAdminUsersRepository', () => {
  let repo: FakeAdminUsersRepository

  beforeEach(() => {
    repo = new FakeAdminUsersRepository()
  })

  it('list_returns_all_when_no_filters', async () => {
    repo.seedMany(5)
    const result = await repo.list({})
    expect(result.items).toHaveLength(5)
    expect(result.total).toBe(5)
  })

  it('list_filters_by_role_AUTHOR', async () => {
    repo.seedMany(3, { role: 'LEARNER' })
    repo.seed({ role: 'AUTHOR' })
    const result = await repo.list({ role: 'AUTHOR' })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.role).toBe('AUTHOR')
  })

  it('list_filters_by_banned_true', async () => {
    repo.seedMany(2)
    repo.seed({ bannedUntil: new Date('2099-01-01') })
    const result = await repo.list({ banned: 'banned' })
    expect(result.items).toHaveLength(1)
  })

  it('list_paginates_via_cursor', async () => {
    const seeded = repo.seedMany(5)
    const result = await repo.list({ limit: 2, cursor: seeded[1]!.id })
    expect(result.items).toHaveLength(2)
    expect(result.items[0]?.id).toBe(seeded[2]!.id)
  })

  it('list_q_matches_username_displayName_or_email', async () => {
    const target = repo.seed({ username: 'unique-needle' })
    repo.seedMany(3)
    const result = await repo.list({ q: 'unique' })
    expect(result.items.some(u => u.id === target.id)).toBe(true)
  })

  it('updateRole_changes_role', async () => {
    const user = repo.seed({ role: 'LEARNER' })
    await repo.updateRole(user.id, 'AUTHOR')
    const result = await repo.list({})
    expect(result.items[0]?.role).toBe('AUTHOR')
  })

  it('setBan_sets_until_and_reason', async () => {
    const user = repo.seed()
    await repo.setBan(user.id, new Date('2099-01-01'), 'spam')
    const result = await repo.list({})
    expect(result.items[0]?.bannedUntil).toEqual(new Date('2099-01-01'))
    expect(result.items[0]?.banReason).toBe('spam')
  })

  it('setChatBan_does_not_modify_global_ban', async () => {
    const user = repo.seed()
    await repo.setChatBan(user.id, new Date('2099-01-01'), 'rude')
    const result = await repo.list({})
    expect(result.items[0]?.bannedUntil).toBeNull()
  })

  it('moderator_view_omits_admin_users_when_hideAdmins_true', async () => {
    repo.seed({ role: 'ADMIN' })
    repo.seed({ role: 'LEARNER' })
    const result = await repo.listForModeration({ hideAdmins: true })
    expect(result.items.every(u => u.role !== 'ADMIN')).toBe(true)
  })

  it('updateRole_throws_for_unknown_user', async () => {
    await expect(repo.updateRole(faker.string.uuid(), 'ADMIN')).rejects.toThrow('USER_NOT_FOUND')
  })
})
