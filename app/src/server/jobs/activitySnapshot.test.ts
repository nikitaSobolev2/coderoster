import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node-cron', () => ({
  default: { schedule: vi.fn() }
}))

import { snapshotPreviousDay } from './activitySnapshot'
import { db } from '~/server/db'

describe('activitySnapshot job', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('snapshot_aggregates_yesterday_activity_into_snapshot_table', async () => {
    const queryRawMock = vi.fn(async () => [{ userId: 'u1', date: '2026-04-25', count: BigInt(5) }])
    const upsertMock = vi.fn(async () => undefined)
    ;(db as unknown as { $queryRaw: typeof queryRawMock }).$queryRaw = queryRawMock
    ;(
      db as unknown as { userActivitySnapshot: { upsert: typeof upsertMock } }
    ).userActivitySnapshot = { upsert: upsertMock }
    await snapshotPreviousDay()
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { count: 5, level: 3 }
      })
    )
  })

  it('snapshot_skips_when_no_activity', async () => {
    const upsertMock = vi.fn()
    ;(db as unknown as { $queryRaw: ReturnType<typeof vi.fn> }).$queryRaw = vi.fn(async () => [])
    ;(
      db as unknown as { userActivitySnapshot: { upsert: typeof upsertMock } }
    ).userActivitySnapshot = { upsert: upsertMock }
    await snapshotPreviousDay()
    expect(upsertMock).not.toHaveBeenCalled()
  })
})
