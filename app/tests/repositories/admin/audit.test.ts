import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'

import { FakeAdminAuditRepository } from '~/../tests/setup/repositories/fakeAdmin'

describe('FakeAdminAuditRepository', () => {
  let repo: FakeAdminAuditRepository

  beforeEach(() => {
    repo = new FakeAdminAuditRepository()
  })

  it('list_returns_entries_sorted_by_createdAt_desc', async () => {
    repo.seed({ createdAt: new Date('2026-01-01') })
    const recent = repo.seed({ createdAt: new Date('2026-04-25') })
    const list = await repo.list()
    expect(list[0]?.id).toBe(recent.id)
  })

  it('list_filters_by_actor_id', async () => {
    const actor = faker.string.uuid()
    repo.seed({ actorId: actor })
    repo.seed()
    const list = await repo.list({ actorId: actor })
    expect(list).toHaveLength(1)
    expect(list[0]?.actorId).toBe(actor)
  })

  it('list_filters_by_target_id', async () => {
    const target = faker.string.uuid()
    repo.seed({ targetId: target })
    repo.seed()
    const list = await repo.list({ targetId: target })
    expect(list).toHaveLength(1)
  })
})
