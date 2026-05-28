import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: {} }))

import { FakeProgressRepository } from './progress.repository'

describe('FakeProgressRepository', () => {
  let repo: FakeProgressRepository
  const userId = faker.string.uuid()
  const lessonId = 'l-py-1-1'

  beforeEach(() => {
    repo = new FakeProgressRepository()
  })

  it('saveDraft_persists_python_code', async () => {
    const code = faker.lorem.lines(2)
    await repo.saveDraft(userId, lessonId, 'python', code)
    const drafts = await repo.getDrafts(userId, lessonId, ['python'])
    expect(drafts.python).toBe(code)
  })

  it('saveDraft_overwrites_existing_language_draft', async () => {
    await repo.saveDraft(userId, lessonId, 'python', 'old')
    await repo.saveDraft(userId, lessonId, 'python', 'new')
    const drafts = await repo.getDrafts(userId, lessonId, ['python'])
    expect(drafts.python).toBe('new')
  })

  it('saveDraft_keeps_other_languages_intact', async () => {
    await repo.saveDraft(userId, lessonId, 'python', 'py code')
    await repo.saveDraft(userId, lessonId, 'php', 'php code')
    const drafts = await repo.getDrafts(userId, lessonId, ['python', 'php'])
    expect(drafts.python).toBe('py code')
    expect(drafts.php).toBe('php code')
  })

  it('getDrafts_returns_only_requested_languages', async () => {
    await repo.saveDraft(userId, lessonId, 'python', 'py code')
    await repo.saveDraft(userId, lessonId, 'php', 'php code')
    const drafts = await repo.getDrafts(userId, lessonId, ['python'])
    expect(drafts.python).toBe('py code')
    expect(drafts.php).toBeUndefined()
  })

  it('markComplete_returns_completed_true_for_any_lesson_in_fake_mode', async () => {
    expect(await repo.markComplete(userId, lessonId)).toEqual({ completed: true })
  })

  it('getTaskAttemptStatus_returns_null_in_fake_mode', async () => {
    expect(await repo.getTaskAttemptStatus(userId, lessonId)).toBeNull()
  })
})
