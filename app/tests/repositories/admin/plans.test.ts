import { beforeEach, describe, expect, it } from 'vitest'

import { FakeAdminPlansRepository } from '~/../tests/setup/repositories/fakeAdmin'

describe('FakeAdminPlansRepository', () => {
  let repo: FakeAdminPlansRepository

  beforeEach(() => {
    repo = new FakeAdminPlansRepository()
  })

  it('list_returns_all_sorted_by_sortOrder_then_tierLevel', async () => {
    repo.seed({ tierLevel: 2, sortOrder: 2 })
    repo.seed({ tierLevel: 0, sortOrder: 0 })
    const list = await repo.list()
    expect(list[0]?.tierLevel).toBe(0)
    expect(list[1]?.tierLevel).toBe(2)
  })

  it('create_persists_tierLevel_and_xpBonus', async () => {
    const row = await repo.create({
      slug: 'pro',
      name: 'Pro',
      tierLevel: 2,
      xpBonusPercent: 25
    })
    expect(row.tierLevel).toBe(2)
    expect(row.xpBonusPercent).toBe(25)
  })

  it('update_changes_maxActiveCourses', async () => {
    const row = repo.seed({ tierLevel: 0 })
    const updated = await repo.update(row.id, { maxActiveCourses: 10 })
    expect(updated.maxActiveCourses).toBe(10)
  })

  it('setDefault_unsets_previous_default', async () => {
    const a = repo.seed({ tierLevel: 0, isDefaultFree: true })
    const b = repo.seed({ tierLevel: 0, isDefaultFree: false })
    await repo.setDefaultFree(b.id)
    const list = await repo.list()
    expect(list.find(p => p.id === a.id)?.isDefaultFree).toBe(false)
    expect(list.find(p => p.id === b.id)?.isDefaultFree).toBe(true)
  })

  it('delete_throws_when_default_plan', async () => {
    const row = repo.seed({ isDefaultFree: true })
    await expect(repo.delete(row.id)).rejects.toThrow('CANNOT_DELETE_DEFAULT_PLAN')
  })

  it('delete_removes_non_default_plan', async () => {
    const row = repo.seed({ tierLevel: 2, isDefaultFree: false })
    await repo.delete(row.id)
    expect(await repo.list()).toHaveLength(0)
  })
})
