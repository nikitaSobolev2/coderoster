import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { authenticatedUserFactory } from '~/../tests/setup/fixtures/userFactory'
import { db } from '~/server/db'

function stubRole(role: 'LEARNER' | 'AUTHOR' | 'MODERATOR' | 'ADMIN') {
  ;(db as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user = {
    findUnique: vi.fn(async () => ({ role, bannedUntil: null }))
  }
}

describe('admin.catalog router (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('catalog_routes_throw_FORBIDDEN_for_LEARNER', async () => {
    stubRole('LEARNER')
    const { caller } = buildTestCaller({ user: authenticatedUserFactory({ role: 'learner' }) })
    await expect(caller.admin.catalog.listCourses({})).rejects.toThrow(/FORBIDDEN|denied/i)
  })
})
