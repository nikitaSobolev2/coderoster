import type { LessonDetail } from './types'
import { getFakeLessonDetail } from './fixtures'
import { stubNotImplemented } from './stub'

export interface LessonRepository {
  getOne(courseSlug: string, lessonId: string): Promise<LessonDetail | null>
}

export class FakeLessonRepository implements LessonRepository {
  async getOne(courseSlug: string, lessonId: string): Promise<LessonDetail | null> {
    return getFakeLessonDetail(courseSlug, lessonId)
  }
}

export class PrismaLessonRepository implements LessonRepository {
  getOne(): Promise<LessonDetail | null> {
    return stubNotImplemented('LessonRepository.getOne')
  }
}
