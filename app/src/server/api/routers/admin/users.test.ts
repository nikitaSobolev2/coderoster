import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { authenticatedUserFactory } from '~/../tests/setup/fixtures/userFactory'
import { db } from '~/server/db'

describe('admin.users router (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('admin_users_list_throws_FORBIDDEN_for_LEARNER', async () => {
    ;(db as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user = {
      findUnique: vi.fn(async () => ({ role: 'LEARNER', bannedUntil: null }))
    }
    const { caller } = buildTestCaller({ user: authenticatedUserFactory({ role: 'learner' }) })
    await expect(caller.admin.users.list({})).rejects.toThrow(/FORBIDDEN|denied/i)
  })

  it('admin_users_list_throws_FORBIDDEN_for_MODERATOR_on_admin_route', async () => {
    ;(db as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user = {
      findUnique: vi.fn(async () => ({ role: 'MODERATOR', bannedUntil: null }))
    }
    const { caller } = buildTestCaller({ user: authenticatedUserFactory({ role: 'moderator' }) })
    await expect(caller.admin.users.list({})).rejects.toThrow(/FORBIDDEN|denied/i)
  })

  it('admin_users_list_succeeds_for_ADMIN', async () => {
    ;(db as unknown as { user: Record<string, ReturnType<typeof vi.fn>> }).user = {
      findUnique: vi.fn(async () => ({ role: 'ADMIN', bannedUntil: null })),
      findMany: vi.fn(async () => []),
      count: vi.fn(async () => 0)
    }
    const { caller } = buildTestCaller({ user: authenticatedUserFactory({ role: 'admin' }) })
    const result = await caller.admin.users.list({})
    expect(result).toMatchObject({ items: expect.any(Array) })
  })
})
