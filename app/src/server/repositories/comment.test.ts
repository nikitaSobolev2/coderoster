import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: {} }))

import { FakeCommentRepository } from './comment.repository'

describe('FakeCommentRepository', () => {
  let repo: FakeCommentRepository
  const authorId = faker.string.uuid()

  beforeEach(() => {
    repo = new FakeCommentRepository()
  })

  it('list_returns_first_page_with_default_size', async () => {
    const page = await repo.listOnProfile('codenikita', null)
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.nextCursor).toBeNull()
  })

  it('post_prepends_new_entry', async () => {
    const body = faker.lorem.sentence()
    const entry = await repo.post(authorId, 'codenikita', body)
    const page = await repo.listOnProfile('codenikita', null)
    expect(page.items[0]?.id).toBe(entry.id)
  })

  it('post_returns_entry_with_authorUsername_set_to_caller', async () => {
    const entry = await repo.post(authorId, 'codenikita', 'hi')
    expect(entry.authorUsername).toBe(authorId)
    expect(entry.body).toBe('hi')
  })

  it('delete_removes_matching_id', async () => {
    const entry = await repo.post(authorId, 'codenikita', 'temp')
    await repo.delete(authorId, entry.id)
    const page = await repo.listOnProfile('codenikita', null)
    expect(page.items.find(e => e.id === entry.id)).toBeUndefined()
  })

  it('delete_is_noop_on_unknown_id', async () => {
    await expect(repo.delete(authorId, 'unknown')).resolves.toBeUndefined()
  })

  it('like_is_silent_in_fake', async () => {
    await expect(repo.like(authorId, 'c1', 'like')).resolves.toBeUndefined()
  })
})
