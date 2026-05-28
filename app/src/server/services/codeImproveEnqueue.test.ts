import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const attemptFindUniqueMock = vi.fn()
const taskFindFirstMock = vi.fn()
const aiJobFindUniqueMock = vi.fn()
const aiJobCreateMock = vi.fn()
const outboxCreateMock = vi.fn()
const txMock = vi.fn()

const planGetEffectiveTier = vi.fn(async () => 0)
const assertCircuit = vi.fn(async () => undefined)

vi.mock('~/server/db', () => ({
  db: {
    courseTaskAttempt: { findUnique: attemptFindUniqueMock },
    courseTask: { findFirst: taskFindFirstMock },
    aiCodeImproveJob: { findUnique: aiJobFindUniqueMock },
    $transaction: (cb: (tx: unknown) => Promise<unknown>) =>
      txMock(cb).catch((err: unknown) => Promise.reject(err))
  }
}))

vi.mock('~/server/services/PlanService', () => ({
  planService: { getEffectiveTier: planGetEffectiveTier }
}))

vi.mock('~/server/services/aiImproveAvailability', () => ({
  assertAiImproveCircuitClosed: assertCircuit
}))

vi.mock('~/shared/contracts/aiCodeImprove', () => ({
  AI_CODE_IMPROVE_TOPIC: 'ai.code_improve.requested'
}))

import { buildAiImproveFingerprint, enqueueCodeImproveJob } from './codeImproveEnqueue'

describe('buildAiImproveFingerprint', () => {
  it('returns_stable_sha256_for_same_inputs', () => {
    const a = buildAiImproveFingerprint('u', 't', 'python', 'k')
    const b = buildAiImproveFingerprint('u', 't', 'python', 'k')
    expect(a).toBe(b)
    expect(a).toHaveLength(64)
  })

  it('differs_when_user_changes', () => {
    expect(buildAiImproveFingerprint('a', 't', 'python', 'k')).not.toBe(
      buildAiImproveFingerprint('b', 't', 'python', 'k')
    )
  })
})

describe('enqueueCodeImproveJob', () => {
  beforeEach(() => {
    attemptFindUniqueMock.mockReset()
    taskFindFirstMock.mockReset()
    aiJobFindUniqueMock.mockReset()
    aiJobCreateMock.mockReset()
    outboxCreateMock.mockReset()
    txMock.mockReset()
    planGetEffectiveTier.mockReset()
    assertCircuit.mockReset()
    planGetEffectiveTier.mockResolvedValue(0)
    assertCircuit.mockResolvedValue(undefined)
  })

  it('throws_FORBIDDEN_when_tier_zero_and_no_bypass', async () => {
    await expect(
      enqueueCodeImproveJob({
        userId: faker.string.uuid(),
        taskId: faker.string.uuid(),
        language: 'python',
        dedupeKey: faker.string.uuid()
      })
    ).rejects.toThrow(/платном/i)
  })

  it('throws_PRECONDITION_FAILED_when_attempt_not_success', async () => {
    planGetEffectiveTier.mockResolvedValueOnce(1)
    attemptFindUniqueMock.mockResolvedValueOnce({ status: 'ACTIVE' })
    await expect(
      enqueueCodeImproveJob({
        userId: faker.string.uuid(),
        taskId: faker.string.uuid(),
        language: 'python',
        dedupeKey: faker.string.uuid()
      })
    ).rejects.toThrow(/Сначала|PRECONDITION_FAILED/i)
  })

  it('enqueue_writes_outbox_event_and_returns_jobId', async () => {
    planGetEffectiveTier.mockResolvedValueOnce(1)
    attemptFindUniqueMock.mockResolvedValueOnce({ status: 'SUCCESS' })
    taskFindFirstMock.mockResolvedValueOnce({
      id: 't1',
      module: { course: { id: 'c1' } }
    })
    aiJobCreateMock.mockResolvedValue({ id: 'j1' })
    const txOuterCb = vi.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        aiCodeImproveJob: {
          findUnique: async () => null,
          create: aiJobCreateMock
        },
        outboxEvent: { create: outboxCreateMock }
      })
    )
    txMock.mockImplementation(cb => txOuterCb(cb))

    const result = await enqueueCodeImproveJob({
      userId: faker.string.uuid(),
      taskId: 't1',
      language: 'python',
      dedupeKey: faker.string.uuid()
    })
    expect(result.jobId).toBe('j1')
    expect(outboxCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ topic: 'ai.code_improve.requested' })
      })
    )
  })
})
