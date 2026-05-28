import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'

import { FakeAdminAchievementsRepository } from '~/../tests/setup/repositories/fakeAdmin'

describe('FakeAdminAchievementsRepository', () => {
  let repo: FakeAdminAchievementsRepository

  beforeEach(() => {
    repo = new FakeAdminAchievementsRepository()
  })

  it('create_persists_rarity_and_goal', async () => {
    const created = await repo.create({
      name: faker.lorem.word(),
      rarity: 'epic',
      goal: 5
    })
    expect(created.rarity).toBe('epic')
    expect(created.goal).toBe(5)
  })

  it('update_changes_hidden_flag', async () => {
    const row = repo.seed({ hidden: false })
    const updated = await repo.update(row.id, { hidden: true })
    expect(updated.hidden).toBe(true)
  })

  it('delete_removes_and_cascades_user_tracks_in_fake', async () => {
    const row = repo.seed()
    repo.trackForUser('u1', row.id)
    await repo.delete(row.id)
    expect(repo.hasUserTrack('u1', row.id)).toBe(false)
  })

  it('update_throws_for_unknown_id', async () => {
    await expect(repo.update('missing', { hidden: true })).rejects.toThrow('ACHIEVEMENT_NOT_FOUND')
  })
})
