import 'server-only'
import type { AttemptStatus, Prisma } from '@prisma/client'
import { db } from '~/server/db'
import type { Language } from '~/server/repositories/types'
import { draftsFromAttemptData, mergeDraftSave } from '~/shared/lib/taskAttemptCurrentData'

/**
 * Resolves a lesson identifier (Prisma `CourseTask.id` cuid or legacy
 * fixture slug stored under `initialData.slug`) to the underlying cuid.
 * Returns `null` when the identifier is unknown — callers treat this as a
 * silent no-op so stale URLs don't surface as 500s in the editor.
 */
async function resolveTaskId(identifier: string): Promise<string | null> {
  const direct = await db.courseTask.findUnique({
    where: { id: identifier },
    select: { id: true }
  })
  if (direct) return direct.id
  const bySlug = await db.courseTask.findFirst({
    where: { initialData: { path: ['slug'], equals: identifier } },
    select: { id: true }
  })
  return bySlug?.id ?? null
}

export interface ProgressRepository {
  saveDraft(userId: string, lessonId: string, language: Language, code: string): Promise<void>
  getDrafts(
    userId: string,
    lessonId: string,
    languages: Language[]
  ): Promise<Partial<Record<Language, string>>>
  getTaskAttemptStatus(userId: string, lessonId: string): Promise<AttemptStatus | null>
  markComplete(userId: string, lessonId: string): Promise<{ completed: boolean }>
}

export class FakeProgressRepository implements ProgressRepository {
  private readonly byLesson = new Map<string, Partial<Record<Language, string>>>()

  async saveDraft(
    userId: string,
    lessonId: string,
    language: Language,
    code: string
  ): Promise<void> {
    const key = this.draftKey(userId, lessonId)
    const prev = this.byLesson.get(key) ?? {}
    this.byLesson.set(key, { ...prev, [language]: code })
  }

  async getDrafts(
    userId: string,
    lessonId: string,
    _languages: Language[]
  ): Promise<Partial<Record<Language, string>>> {
    return { ...(this.byLesson.get(this.draftKey(userId, lessonId)) ?? {}) }
  }

  async getTaskAttemptStatus(_userId: string, _lessonId: string): Promise<AttemptStatus | null> {
    return null
  }

  async markComplete(_userId: string, _lessonId: string): Promise<{ completed: boolean }> {
    return { completed: true }
  }

  private draftKey(userId: string, lessonId: string): string {
    return `${userId}::${lessonId}`
  }
}

export class PrismaProgressRepository implements ProgressRepository {
  async saveDraft(
    userId: string,
    lessonId: string,
    language: Language,
    code: string
  ): Promise<void> {
    const taskId = await resolveTaskId(lessonId)
    if (!taskId) return
    const existing = await db.courseTaskAttempt.findUnique({
      where: { courseTaskId_userId: { courseTaskId: taskId, userId } },
      select: { currentData: true }
    })
    const merged = mergeDraftSave(existing?.currentData, language, code) as Prisma.InputJsonValue
    await db.courseTaskAttempt.upsert({
      where: { courseTaskId_userId: { courseTaskId: taskId, userId } },
      update: { currentData: merged },
      create: { courseTaskId: taskId, userId, currentData: merged }
    })
  }

  async getDrafts(
    userId: string,
    lessonId: string,
    languages: Language[]
  ): Promise<Partial<Record<Language, string>>> {
    const taskId = await resolveTaskId(lessonId)
    if (!taskId) return {}
    const attempt = await db.courseTaskAttempt.findUnique({
      where: { courseTaskId_userId: { courseTaskId: taskId, userId } }
    })
    if (!attempt) return {}
    return draftsFromAttemptData(attempt.currentData, languages)
  }

  async getTaskAttemptStatus(userId: string, lessonId: string): Promise<AttemptStatus | null> {
    const taskId = await resolveTaskId(lessonId)
    if (!taskId) return null
    const attempt = await db.courseTaskAttempt.findUnique({
      where: { courseTaskId_userId: { courseTaskId: taskId, userId } },
      select: { status: true }
    })
    return attempt?.status ?? null
  }

  async markComplete(userId: string, lessonId: string): Promise<{ completed: boolean }> {
    const taskId = await resolveTaskId(lessonId)
    if (!taskId) return { completed: false }
    return db.$transaction(async tx => {
      const attempt = await tx.courseTaskAttempt.upsert({
        where: { courseTaskId_userId: { courseTaskId: taskId, userId } },
        update: { status: 'SUCCESS' },
        create: { courseTaskId: taskId, userId, status: 'SUCCESS' }
      })
      const task = await tx.courseTask.findUnique({
        where: { id: taskId },
        include: { module: { include: { course: true } } }
      })
      if (task?.module) {
        await this.upsertEnrollmentProgress(tx, userId, task.module.course.id, taskId)
      }
      return { completed: attempt.status === 'SUCCESS' }
    })
  }

  private async upsertEnrollmentProgress(
    tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
    userId: string,
    courseId: string,
    lessonId: string
  ): Promise<void> {
    const enrollment = await tx.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } }
    })
    if (!enrollment) return
    const completed = enrollment.completedLessonIds.includes(lessonId)
      ? enrollment.completedLessonIds
      : [...enrollment.completedLessonIds, lessonId]
    const totalLessons = await tx.courseTask.count({
      where: { module: { courseId } }
    })
    const percent = totalLessons === 0 ? 0 : Math.round((completed.length / totalLessons) * 100)
    await tx.enrollment.update({
      where: { id: enrollment.id },
      data: {
        completedLessonIds: completed,
        progressPercent: percent,
        status: percent >= 100 ? 'FINISHED' : enrollment.status,
        finishedAt: percent >= 100 ? new Date() : enrollment.finishedAt
      }
    })
  }
}
