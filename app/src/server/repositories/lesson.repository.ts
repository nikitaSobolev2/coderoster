import 'server-only'
import { db } from '~/server/db'
import { toLessonDetail } from './mappers'
import type { LessonDetail } from './types'
import { getFakeLessonDetail } from './fixtures'

export interface LessonRepository {
  getOne(courseSlug: string, lessonId: string): Promise<LessonDetail | null>
}

export class FakeLessonRepository implements LessonRepository {
  async getOne(courseSlug: string, lessonId: string): Promise<LessonDetail | null> {
    return getFakeLessonDetail(courseSlug, lessonId)
  }
}

export class PrismaLessonRepository implements LessonRepository {
  async getOne(courseSlug: string, lessonId: string): Promise<LessonDetail | null> {
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
    const index = flat.findIndex(item => item.task.id === lessonId)
    if (index < 0) return null
    const current = flat[index]!
    const previous = index > 0 ? flat[index - 1]!.task.id : null
    const next = index < flat.length - 1 ? flat[index + 1]!.task.id : null
    return toLessonDetail(current.task, current.module, course, index + 1, previous, next)
  }
}
