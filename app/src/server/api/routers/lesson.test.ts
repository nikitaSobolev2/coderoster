import { describe, expect, it } from 'vitest'

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'

describe('lesson router (integration)', () => {
  it('lesson_getOne_returns_detail_for_authenticated', async () => {
    const { caller } = buildTestCaller()
    const lesson = await caller.lesson.getOne({
      courseSlug: 'python-basics',
      lessonId: 'l-py-1-1'
    })
    expect(lesson?.title).toBe('Hello, World')
  })

  it('lesson_getOne_returns_null_for_unknown', async () => {
    const { caller } = buildTestCaller()
    expect(await caller.lesson.getOne({ courseSlug: 'python-basics', lessonId: 'nope' })).toBeNull()
  })

  it('lesson_getOne_works_for_anonymous_viewer', async () => {
    const { caller } = buildTestCaller({ user: null })
    const lesson = await caller.lesson.getOne({
      courseSlug: 'python-basics',
      lessonId: 'l-py-1-1'
    })
    expect(lesson?.userCanAccess).toBe(true)
  })
})
