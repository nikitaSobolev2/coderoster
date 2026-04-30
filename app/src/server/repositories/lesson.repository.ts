import 'server-only'
import type { CourseTask } from '@prisma/client'
import { db } from '~/server/db'
import { planService } from '~/server/services/PlanService'
import { toLessonDetail } from './mappers'
import type { LessonDetail } from './types'
import { getFakeLessonDetail } from './fixtures'

/**
 * URL routes were authored against the fake-fixture slug (`l-py-1-1`) before
 * Prisma seeding assigned cuid primary keys. Until the platform migrates fully
 * to cuid links, this helper resolves either form so legacy bookmarks keep
 * working.
 */
function taskMatchesIdentifier(task: CourseTask, identifier: string): boolean {
  if (task.id === identifier) return true
  const initial = task.initialData as { slug?: string } | null
  return initial?.slug === identifier
}

export interface LessonRepository {
  getOne(
    courseSlug: string,
    lessonId: string,
    viewerUserId?: string | null
  ): Promise<LessonDetail | null>
}

export class FakeLessonRepository implements LessonRepository {
  async getOne(
    courseSlug: string,
    lessonId: string,
    _viewerUserId?: string | null
  ): Promise<LessonDetail | null> {
    void _viewerUserId
    return getFakeLessonDetail(courseSlug, lessonId, 99)
  }
}

export class PrismaLessonRepository implements LessonRepository {
  async getOne(
    courseSlug: string,
    lessonId: string,
    viewerUserId?: string | null
  ): Promise<LessonDetail | null> {
    const viewerTier =
      viewerUserId !== null && viewerUserId !== undefined
        ? await planService.getEffectiveTier(viewerUserId)
        : null
    const course = await db.course.findUnique({
      where: { slug: courseSlug },
      include: {
        modules: {
          include: { tasks: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' }
        }
      }
    })
    if (!course) return null
    const flat = course.modules.flatMap(module => module.tasks.map(task => ({ module, task })))
    const index = flat.findIndex(item => taskMatchesIdentifier(item.task, lessonId))
    if (index < 0) return null
    const current = flat[index]!
    const previous = index > 0 ? flat[index - 1]!.task.id : null
    const next = index < flat.length - 1 ? flat[index + 1]!.task.id : null
    const autotests = await db.courseTaskAutotest.findMany({
      where: { courseTaskId: current.task.id },
      orderBy: { order: 'asc' },
      select: { name: true, hidden: true }
    })
    const testNames = autotests.length > 0 ? autotests : [{ name: 'Базовый прогон', hidden: false }]
    return toLessonDetail({
      task: current.task,
      module: current.module,
      course,
      order: index + 1,
      previousLessonId: previous,
      nextLessonId: next,
      testNames,
      viewerTier
    })
  }
}
