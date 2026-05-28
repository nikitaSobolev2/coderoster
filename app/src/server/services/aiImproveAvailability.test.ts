import { beforeEach, describe, expect, it, vi } from 'vitest'

const { redisGetMock } = vi.hoisted(() => ({
  redisGetMock: vi.fn()
}))

vi.mock('~/server/redis', () => ({
  redis: { get: redisGetMock }
}))

import { assertAiImproveCircuitClosed } from './aiImproveAvailability'

describe('assertAiImproveCircuitClosed', () => {
  beforeEach(() => {
    redisGetMock.mockReset()
  })

  it('ai_available_when_no_value_set', async () => {
    redisGetMock.mockResolvedValueOnce(null)
    await expect(assertAiImproveCircuitClosed()).resolves.toBeUndefined()
  })

  it('ai_available_when_until_in_past', async () => {
    redisGetMock.mockResolvedValueOnce(String(Date.now() - 60_000))
    await expect(assertAiImproveCircuitClosed()).resolves.toBeUndefined()
  })

  it('ai_unavailable_when_until_in_future', async () => {
    redisGetMock.mockResolvedValueOnce(String(Date.now() + 60_000))
    await expect(assertAiImproveCircuitClosed()).rejects.toThrow(/перегружен|SERVICE_UNAVAILABLE/i)
  })

  it('ai_available_when_value_is_non_numeric', async () => {
    redisGetMock.mockResolvedValueOnce('not-a-number')
    await expect(assertAiImproveCircuitClosed()).resolves.toBeUndefined()
  })
})
