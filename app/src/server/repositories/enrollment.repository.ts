import 'server-only'
import { db } from '~/server/db'
import { toCourseSummary, toEnrollmentState } from './mappers'
import type { CourseShowcase, EnrollmentState } from './types'
import {
  findFakeCourseBySlug,
  getFakeEnrollment,
  listFakeEnrollments,
  setFakeEnrollment
} from './fixtures'

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
  async getMine(userId: string, courseSlug: string): Promise<EnrollmentState | null> {
    const enrollment = await db.enrollment.findFirst({
      where: { userId, course: { slug: courseSlug } }
    })
    if (!enrollment) return null
    return toEnrollmentState(enrollment, courseSlug)
  }

  async start(userId: string, courseSlug: string): Promise<EnrollmentState> {
    const course = await db.course.findUniqueOrThrow({ where: { slug: courseSlug } })
    const firstLessonId = await this.findFirstLessonId(course.id)
    const enrollment = await db.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: course.id } },
      update: {
        status: 'ACTIVE',
        startedAt: new Date(),
        finishedAt: null,
        progressPercent: 0,
        completedLessonIds: [],
        currentLessonId: firstLessonId
      },
      create: {
        userId,
        courseId: course.id,
        currentLessonId: firstLessonId
      }
    })
    return toEnrollmentState(enrollment, courseSlug)
  }

  async abandon(userId: string, courseSlug: string): Promise<EnrollmentState> {
    const course = await db.course.findUniqueOrThrow({ where: { slug: courseSlug } })
    const enrollment = await db.enrollment.update({
      where: { userId_courseId: { userId, courseId: course.id } },
      data: { status: 'ABANDONED', finishedAt: new Date() }
    })
    return toEnrollmentState(enrollment, courseSlug)
  }

  async listShowcase(userId: string) {
    const enrollments = await db.enrollment.findMany({
      where: { userId, status: { in: ['ACTIVE', 'FINISHED'] } },
      include: {
        course: {
          include: {
            author: true,
            _count: { select: { enrollments: true } }
          }
        }
      },
      orderBy: { startedAt: 'desc' }
    })

    const active: CourseShowcase[] = []
    const finished: CourseShowcase[] = []
    for (const enrollment of enrollments) {
      const showcase: CourseShowcase = {
        course: toCourseSummary(enrollment.course),
        enrollment: toEnrollmentState(enrollment, enrollment.course.slug)
      }
      if (enrollment.status === 'ACTIVE') active.push(showcase)
      else if (enrollment.status === 'FINISHED') finished.push(showcase)
    }
    return { active, finished }
  }

  private async findFirstLessonId(courseId: string): Promise<string | null> {
    const firstModule = await db.courseModule.findFirst({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { tasks: { orderBy: { order: 'asc' }, take: 1 } }
    })
    return firstModule?.tasks[0]?.id ?? null
  }
}
