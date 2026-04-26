import type { CourseShowcase, EnrollmentState } from './types'
import {
  findFakeCourseBySlug,
  getFakeEnrollment,
  listFakeEnrollments,
  setFakeEnrollment
} from './fixtures'
import { stubNotImplemented } from './stub'

export interface EnrollmentRepository {
  getMine(userId: string, courseSlug: string): Promise<EnrollmentState | null>
  start(userId: string, courseSlug: string): Promise<EnrollmentState>
  abandon(userId: string, courseSlug: string): Promise<EnrollmentState>
  listShowcase(userId: string): Promise<{ active: CourseShowcase[]; finished: CourseShowcase[] }>
}

export class FakeEnrollmentRepository implements EnrollmentRepository {
  async getMine(_userId: string, courseSlug: string): Promise<EnrollmentState | null> {
    return getFakeEnrollment(courseSlug)
  }

  async start(_userId: string, courseSlug: string): Promise<EnrollmentState> {
    const next: EnrollmentState = {
      courseSlug,
      status: 'active',
      startedAt: new Date(),
      finishedAt: null,
      progressPercent: 0,
      completedLessonIds: [],
      currentLessonId: null
    }
    setFakeEnrollment(next)
    return next
  }

  async abandon(_userId: string, courseSlug: string): Promise<EnrollmentState> {
    const existing = getFakeEnrollment(courseSlug)
    const next: EnrollmentState = {
      courseSlug,
      status: 'abandoned',
      startedAt: existing?.startedAt ?? new Date(),
      finishedAt: new Date(),
      progressPercent: existing?.progressPercent ?? 0,
      completedLessonIds: existing?.completedLessonIds ?? [],
      currentLessonId: null
    }
    setFakeEnrollment(next)
    return next
  }

  async listShowcase(_userId: string) {
    const enrollments = listFakeEnrollments()
    const active: CourseShowcase[] = []
    const finished: CourseShowcase[] = []
    for (const enrollment of enrollments) {
      const course = findFakeCourseBySlug(enrollment.courseSlug)
      if (!course) continue
      const showcase: CourseShowcase = { course, enrollment }
      if (enrollment.status === 'active') active.push(showcase)
      else if (enrollment.status === 'finished') finished.push(showcase)
    }
    return { active, finished }
  }
}

export class PrismaEnrollmentRepository implements EnrollmentRepository {
  getMine(): Promise<EnrollmentState | null> {
    return stubNotImplemented('EnrollmentRepository.getMine')
  }

  start(): Promise<EnrollmentState> {
    return stubNotImplemented('EnrollmentRepository.start')
  }

  abandon(): Promise<EnrollmentState> {
    return stubNotImplemented('EnrollmentRepository.abandon')
  }

  listShowcase() {
    return stubNotImplemented('EnrollmentRepository.listShowcase')
  }
}
