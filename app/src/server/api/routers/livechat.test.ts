import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/livechat/broadcast', () => ({
  publishLivechatEvent: vi.fn(async () => undefined)
}))

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'

describe('livechat router (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('livechat_listMessages_returns_empty_in_fake_mode', async () => {
    const { caller } = buildTestCaller({ user: null })
    const result = await caller.livechat.listMessages({ cursorOlderId: null })
    expect(result.items).toEqual([])
    expect(result.nextCursorOlder).toBeNull()
  })

  it('livechat_getPolicies_returns_allowGuests_true_in_fake_mode', async () => {
    const { caller } = buildTestCaller({ user: null })
    const policies = await caller.livechat.getPolicies()
    expect(policies.allowGuests).toBe(true)
  })
})
