import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { authenticatedUserFactory } from '~/../tests/setup/fixtures/userFactory'
import { db } from '~/server/db'

describe('auditLog middleware (integration via admin.languages.update)', () => {
  let auditCreate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    auditCreate = vi.fn(async () => undefined)
    ;(db as unknown as { auditLog: { create: ReturnType<typeof vi.fn> } }).auditLog = {
      create: auditCreate
    }
    ;(db as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user = {
      findUnique: vi.fn(async () => ({ role: 'ADMIN', bannedUntil: null }))
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('audit_writes_row_on_successful_mutation', async () => {
    const { caller } = buildTestCaller({ user: authenticatedUserFactory({ role: 'admin' }) })
    await caller.admin.languages.update({ languages: ['python'] })
    // Wait microtask for fire-and-forget audit write
    await new Promise(resolve => setImmediate(resolve))
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: expect.stringContaining('languages.update') })
      })
    )
  })

  it('audit_skips_query_procedures', async () => {
    ;(db as unknown as { auditLog: { findMany: ReturnType<typeof vi.fn> } }).auditLog.findMany =
      vi.fn(async () => [])
    const { caller } = buildTestCaller({ user: authenticatedUserFactory({ role: 'admin' }) })
    await caller.admin.audit.list({})
    await new Promise(resolve => setImmediate(resolve))
    expect(auditCreate).not.toHaveBeenCalled()
  })
})
