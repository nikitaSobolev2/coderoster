import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: {} }))

import { setFakeEnrollment } from './fixtures'
import { FakeEnrollmentRepository } from './enrollment.repository'

const userId = faker.string.uuid()

describe('FakeEnrollmentRepository', () => {
  let repo: FakeEnrollmentRepository

  beforeEach(() => {
    repo = new FakeEnrollmentRepository()
    setFakeEnrollment({
      courseSlug: 'python-basics',
      status: 'active',
      startedAt: new Date('2026-04-12T00:00:00Z'),
      finishedAt: null,
      progressPercent: 38,
      completedLessonIds: ['l-py-1-1', 'l-py-1-2', 'l-py-1-3'],
      currentLessonId: 'l-py-2-1'
    })
    setFakeEnrollment({
      courseSlug: 'php-api-fundamentals',
      status: 'finished',
      startedAt: new Date('2026-01-26T00:00:00Z'),
      finishedAt: new Date('2026-03-26T00:00:00Z'),
      progressPercent: 100,
      completedLessonIds: ['l-php-1-1', 'l-php-1-2', 'l-php-2-1', 'l-php-2-2'],
      currentLessonId: null
    })
  })

  it('getMine_returns_null_when_course_unknown', async () => {
    expect(await repo.getMine(userId, 'unknown-course')).toBeNull()
  })

  it('getMine_returns_active_enrollment_when_present', async () => {
    const enrollment = await repo.getMine(userId, 'python-basics')
    expect(enrollment?.status).toBe('active')
  })

  it('start_throws_COURSE_NOT_FOUND_for_unknown_slug', async () => {
    await expect(repo.start(userId, 'missing-course')).rejects.toThrow('COURSE_NOT_FOUND')
  })

  it('start_is_idempotent_when_already_active', async () => {
    const result = await repo.start(userId, 'python-basics')
    expect(result.status).toBe('active')
  })

  it('abandon_sets_status_abandoned_and_finishedAt', async () => {
    const result = await repo.abandon(userId, 'python-basics')
    expect(result.status).toBe('abandoned')
    expect(result.finishedAt).not.toBeNull()
  })

  it('listShowcase_groups_active_and_finished_by_status', async () => {
    const showcase = await repo.listShowcase(userId)
    expect(showcase.active.some(s => s.enrollment.courseSlug === 'python-basics')).toBe(true)
    expect(showcase.finished.some(s => s.enrollment.courseSlug === 'php-api-fundamentals')).toBe(
      true
    )
  })
})
