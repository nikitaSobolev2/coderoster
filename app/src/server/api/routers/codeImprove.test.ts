import { beforeEach, describe, expect, it, vi } from 'vitest'

const enqueueMock = vi.fn(async () => ({ jobId: 'job-1' }))

vi.mock('~/server/services/codeImproveEnqueue', () => ({
  enqueueCodeImproveJob: (...args: unknown[]) => enqueueMock(...args)
}))

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'
import { db } from '~/server/db'

describe('codeImprove router (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(
      db as unknown as { aiCodeImproveJob: { findFirst: ReturnType<typeof vi.fn> } }
    ).aiCodeImproveJob = {
      findFirst: vi.fn(async () => ({ id: 'job-1', status: 'QUEUED' }))
    }
  })

  it('codeImprove_start_returns_jobId_via_service', async () => {
    const { caller } = buildTestCaller()
    const result = await caller.codeImprove.start({
      taskId: 't1',
      language: 'python',
      dedupeKey: '11111111-1111-1111-1111-111111111111'
    })
    expect(result?.jobId).toBe('job-1')
  })

  it('codeImprove_getJob_returns_status_for_owned_job', async () => {
    const { caller } = buildTestCaller()
    const job = await caller.codeImprove.getJob({ jobId: 'job-1' })
    expect(job?.status).toBe('QUEUED')
  })
})
