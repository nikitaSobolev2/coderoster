import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'

describe('progress router (integration)', () => {
  it('progress_saveDraft_persists_via_repo', async () => {
    const { caller } = buildTestCaller()
    const code = faker.lorem.lines(2)
    const result = await caller.progress.saveDraft({
      lessonId: 'l-py-1-1',
      language: 'python',
      code
    })
    expect(result).toEqual({ ok: true })
  })

  it('progress_getDrafts_returns_only_requested_languages', async () => {
    const { caller } = buildTestCaller()
    const lessonId = 'l-py-1-1'
    await caller.progress.saveDraft({ lessonId, language: 'python', code: 'a' })
    const drafts = await caller.progress.getDrafts({ lessonId, languages: ['python'] })
    expect(drafts.python).toBe('a')
  })

  it('progress_markComplete_returns_completed_true', async () => {
    const { caller } = buildTestCaller()
    const result = await caller.progress.markComplete({ lessonId: 'l-py-1-1' })
    expect(result).toEqual({ completed: true })
  })
})
