import { describe, expect, it, vi } from 'vitest'

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { authenticatedUserFactory } from '~/../tests/setup/fixtures/userFactory'
import { db } from '~/server/db'

describe('admin.audit router (integration)', () => {
  it('audit_throws_FORBIDDEN_for_MODERATOR', async () => {
    ;(db as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user = {
      findUnique: vi.fn(async () => ({ role: 'MODERATOR', bannedUntil: null }))
    }
    const { caller } = buildTestCaller({ user: authenticatedUserFactory({ role: 'moderator' }) })
    await expect(caller.admin.audit.list({})).rejects.toThrow(/FORBIDDEN|denied/i)
  })
})
