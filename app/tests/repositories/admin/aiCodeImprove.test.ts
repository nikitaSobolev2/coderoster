import { describe, expect, it } from 'vitest'

import { FakeAdminAiCodeImproveRepository } from '~/../tests/setup/repositories/fakeAdmin'

describe('FakeAdminAiCodeImproveRepository', () => {
  it('get_returns_default_when_unset', async () => {
    const repo = new FakeAdminAiCodeImproveRepository()
    const config = await repo.get()
    expect(config.model).toBe('gpt-4o-mini')
  })

  it('update_persists_model_and_apiKey_alias', async () => {
    const repo = new FakeAdminAiCodeImproveRepository()
    const next = await repo.update({ model: 'gpt-4o', apiKeyAlias: 'CUSTOM_KEY' })
    expect(next.model).toBe('gpt-4o')
    expect(next.apiKeyAlias).toBe('CUSTOM_KEY')
  })
})
