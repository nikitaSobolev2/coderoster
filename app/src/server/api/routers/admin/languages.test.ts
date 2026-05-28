import { describe, expect, it, vi } from 'vitest'

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { authenticatedUserFactory } from '~/../tests/setup/fixtures/userFactory'
import { FakeAdminLanguagesRepository } from '~/../tests/setup/repositories/fakeAdmin'
import { db } from '~/server/db'

describe('admin.languages router (integration)', () => {
  it('languages_update_throws_FORBIDDEN_for_AUTHOR', async () => {
    ;(db as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user = {
      findUnique: vi.fn(async () => ({ role: 'AUTHOR', bannedUntil: null }))
    }
    const { caller } = buildTestCaller({ user: authenticatedUserFactory({ role: 'author' }) })
    await expect(caller.admin.languages.update({ languages: ['python'] })).rejects.toThrow(
      /FORBIDDEN|denied/i
    )
  })

  it('languages_list_succeeds_for_AUTHOR_via_staff_procedure', async () => {
    ;(db as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user = {
      findUnique: vi.fn(async () => ({ role: 'AUTHOR', bannedUntil: null }))
    }
    const adminLanguagesRepo = new FakeAdminLanguagesRepository()
    const { caller } = buildTestCaller({
      user: authenticatedUserFactory({ role: 'author' }),
      adminOverrides: {
        languages: adminLanguagesRepo as unknown as never
      }
    })
    const list = await caller.admin.languages.list()
    expect(list).toContain('python')
  })
})
