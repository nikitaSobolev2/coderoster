import { describe, expect, it, vi } from 'vitest'

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { authenticatedUserFactory } from '~/../tests/setup/fixtures/userFactory'
import { db } from '~/server/db'

describe('admin.contentPages router (integration)', () => {
  it('contentPages_throws_FORBIDDEN_for_LEARNER', async () => {
    ;(db as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user = {
      findUnique: vi.fn(async () => ({ role: 'LEARNER', bannedUntil: null }))
    }
    const { caller } = buildTestCaller({ user: authenticatedUserFactory({ role: 'learner' }) })
    await expect(caller.admin.contentPages.list({})).rejects.toThrow(/FORBIDDEN|denied/i)
  })
})
