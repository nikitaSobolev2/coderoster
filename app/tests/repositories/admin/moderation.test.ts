import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  FakeAdminCommentsRepository,
  FakeAdminLeaderboardRepository
} from '~/../tests/setup/repositories/fakeAdmin'

describe('FakeAdminCommentsRepository', () => {
  let repo: FakeAdminCommentsRepository

  beforeEach(() => {
    repo = new FakeAdminCommentsRepository()
  })

  it('deleteComment_removes_from_any_thread', async () => {
    const c = repo.seed()
    await repo.deleteComment(c.id)
    expect((await repo.list()).find(x => x.id === c.id)).toBeUndefined()
  })

  it('list_returns_sorted_by_createdAt_desc', async () => {
    const old = repo.seed({ createdAt: new Date('2026-01-01') })
    const recent = repo.seed({ createdAt: new Date('2026-04-25') })
    const list = await repo.list()
    expect(list[0]?.id).toBe(recent.id)
    expect(list[1]?.id).toBe(old.id)
  })
})

describe('FakeAdminLeaderboardRepository', () => {
  let repo: FakeAdminLeaderboardRepository

  beforeEach(() => {
    repo = new FakeAdminLeaderboardRepository()
  })

  it('toggleExclude_writes_user_flag', async () => {
    const userId = faker.string.uuid()
    await repo.toggleExclude(userId, true)
    expect(repo.isExcluded(userId)).toBe(true)
    await repo.toggleExclude(userId, false)
    expect(repo.isExcluded(userId)).toBe(false)
  })
})
