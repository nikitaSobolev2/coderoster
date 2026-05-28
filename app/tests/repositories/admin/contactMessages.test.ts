import { beforeEach, describe, expect, it } from 'vitest'

import { FakeAdminContactMessagesRepository } from '~/../tests/setup/repositories/fakeAdmin'

describe('FakeAdminContactMessagesRepository', () => {
  let repo: FakeAdminContactMessagesRepository

  beforeEach(() => {
    repo = new FakeAdminContactMessagesRepository()
  })

  it('list_returns_paginated_by_createdAt_desc', async () => {
    const old = repo.seed({ createdAt: new Date('2026-01-01') })
    const recent = repo.seed({ createdAt: new Date('2026-04-25') })
    const list = await repo.list({})
    expect(list[0]?.id).toBe(recent.id)
    expect(list[1]?.id).toBe(old.id)
  })

  it('list_filters_by_source_HOME', async () => {
    repo.seed({ source: 'HOME' })
    repo.seed({ source: 'PLATFORM' })
    const list = await repo.list({ source: 'HOME' })
    expect(list.every(m => m.source === 'HOME')).toBe(true)
  })
})
