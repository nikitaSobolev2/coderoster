import { describe, expect, it } from 'vitest'

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { authenticatedUserFactory } from '~/../tests/setup/fixtures/userFactory'

describe('account router (integration)', () => {
  it('account_requestDeletion_returns_queued_when_username_matches', async () => {
    const user = authenticatedUserFactory({ username: 'nikita' })
    const { caller } = buildTestCaller({ user })
    const result = await caller.account.requestDeletion({ confirmUsername: 'nikita' })
    expect(result?.queued).toBe(true)
  })

  it('account_requestDeletion_throws_BAD_REQUEST_when_confirm_mismatch', async () => {
    const user = authenticatedUserFactory({ username: 'nikita' })
    const { caller } = buildTestCaller({ user })
    await expect(caller.account.requestDeletion({ confirmUsername: 'wrong' })).rejects.toThrow(
      /совпадает|BAD_REQUEST/i
    )
  })

  it('account_status_returns_settings', async () => {
    const { caller } = buildTestCaller()
    const status = await caller.account.status()
    expect(status.username).toBeTruthy()
  })
})
