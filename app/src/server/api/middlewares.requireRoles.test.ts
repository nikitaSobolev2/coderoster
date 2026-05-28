import { describe, expect, it, vi } from 'vitest'

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { authenticatedUserFactory } from '~/../tests/setup/fixtures/userFactory'
import { db } from '~/server/db'

describe('requireRoles middleware (integration via admin.audit.list)', () => {
  it('requireRoles_allows_listed_role_ADMIN', async () => {
    ;(db as unknown as { user: Record<string, ReturnType<typeof vi.fn>> }).user = {
      findUnique: vi.fn(async () => ({ role: 'ADMIN', bannedUntil: null }))
    }
    ;(db as unknown as { auditLog: Record<string, ReturnType<typeof vi.fn>> }).auditLog = {
      findMany: vi.fn(async () => [])
    }
    const { caller } = buildTestCaller({ user: authenticatedUserFactory({ role: 'admin' }) })
    await expect(caller.admin.audit.list({})).resolves.toBeDefined()
  })

  it('requireRoles_rejects_unlisted_with_FORBIDDEN', async () => {
    ;(db as unknown as { user: Record<string, ReturnType<typeof vi.fn>> }).user = {
      findUnique: vi.fn(async () => ({ role: 'LEARNER', bannedUntil: null }))
    }
    const { caller } = buildTestCaller({ user: authenticatedUserFactory({ role: 'learner' }) })
    await expect(caller.admin.audit.list({})).rejects.toThrow(/FORBIDDEN|denied/i)
  })

  it('requireRoles_rejects_banned_user_with_FORBIDDEN_account_suspended', async () => {
    ;(db as unknown as { user: Record<string, ReturnType<typeof vi.fn>> }).user = {
      findUnique: vi.fn(async () => ({
        role: 'ADMIN',
        bannedUntil: new Date(Date.now() + 60_000)
      }))
    }
    const { caller } = buildTestCaller({ user: authenticatedUserFactory({ role: 'admin' }) })
    await expect(caller.admin.audit.list({})).rejects.toThrow(/Account suspended|FORBIDDEN/i)
  })

  it('requireRoles_rejects_when_user_deleted_between_requests', async () => {
    ;(db as unknown as { user: Record<string, ReturnType<typeof vi.fn>> }).user = {
      findUnique: vi.fn(async () => null)
    }
    const { caller } = buildTestCaller({ user: authenticatedUserFactory({ role: 'admin' }) })
    await expect(caller.admin.audit.list({})).rejects.toThrow(/Sign in required|UNAUTHORIZED/i)
  })
})
