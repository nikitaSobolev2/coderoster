import { describe, expect, it } from 'vitest'

import { FakeAdminLanguagesRepository } from '~/../tests/setup/repositories/fakeAdmin'

describe('FakeAdminLanguagesRepository', () => {
  it('list_returns_allowed_languages_from_default', async () => {
    const repo = new FakeAdminLanguagesRepository()
    expect(await repo.list()).toEqual(['python', 'php'])
  })

  it('update_persists_new_list', async () => {
    const repo = new FakeAdminLanguagesRepository()
    await repo.update(['python'])
    expect(await repo.list()).toEqual(['python'])
  })
})
