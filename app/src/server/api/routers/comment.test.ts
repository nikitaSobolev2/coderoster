import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/cache/invalidateProfileCaches', () => ({
  invalidateProfileCachesForUsername: vi.fn(async () => undefined),
  invalidateProfileCachesForCommentId: vi.fn(async () => undefined),
  invalidateProfileCachesForUserId: vi.fn(async () => undefined)
}))

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'

describe('comment router (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('comment_list_returns_first_page', async () => {
    const { caller } = buildTestCaller({ user: null })
    const page = await caller.comment.listOnProfile({ username: 'codenikita' })
    expect(page.items.length).toBeGreaterThan(0)
  })

  it('comment_post_creates_entry_and_returns_it', async () => {
    const { caller } = buildTestCaller()
    const body = faker.lorem.paragraph(1)
    const entry = await caller.comment.post({ username: 'codenikita', body })
    expect(entry?.body).toBe(body)
  })

  it('comment_delete_returns_ok', async () => {
    const { caller } = buildTestCaller()
    const result = await caller.comment.delete({ commentId: faker.string.uuid() })
    expect(result).toEqual({ ok: true })
  })

  it('comment_vote_records_like_and_returns_ok', async () => {
    const { caller } = buildTestCaller()
    const result = await caller.comment.vote({
      commentId: faker.string.uuid(),
      vote: 'like'
    })
    expect(result).toEqual({ ok: true })
  })
})
