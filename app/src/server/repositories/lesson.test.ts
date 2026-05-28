import { describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: {} }))

import { FakeLessonRepository } from './lesson.repository'

describe('FakeLessonRepository', () => {
  const repo = new FakeLessonRepository()

  it('getOne_returns_detail_with_neighbours_when_found', async () => {
    const lesson = await repo.getOne('python-basics', 'l-py-1-2')
    expect(lesson?.title).toBe('Переменные')
    expect(lesson?.previousLessonId).toBe('l-py-1-1')
    expect(lesson?.nextLessonId).toBe('l-py-1-3')
  })

  it('getOne_returns_null_for_unknown_lesson', async () => {
    expect(await repo.getOne('python-basics', 'lesson-x')).toBeNull()
  })

  it('getOne_returns_null_for_unknown_course', async () => {
    expect(await repo.getOne('not-a-course', 'l-py-1-1')).toBeNull()
  })

  it('getOne_includes_starterCode_for_default_language', async () => {
    const lesson = await repo.getOne('python-basics', 'l-py-1-1')
    expect(lesson?.starterCode).toContain('Hello, World')
  })

  it('getOne_returns_userCanAccess_true_for_free_course', async () => {
    const lesson = await repo.getOne('python-basics', 'l-py-1-1')
    expect(lesson?.userCanAccess).toBe(true)
  })

  it('allowedLanguages_default_to_course_language', async () => {
    const lesson = await repo.getOne('python-basics', 'l-py-1-1')
    expect(lesson?.allowedLanguages).toEqual([lesson?.language])
  })
})
