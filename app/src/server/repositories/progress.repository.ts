import 'server-only'
import { db } from '~/server/db'

export interface ProgressRepository {
  saveDraft(userId: string, lessonId: string, code: string): Promise<void>
  getDraft(userId: string, lessonId: string): Promise<string | null>
  markComplete(userId: string, lessonId: string): Promise<{ completed: boolean }>
}

export class FakeProgressRepository implements ProgressRepository {
  private readonly drafts = new Map<string, string>()

  async saveDraft(userId: string, lessonId: string, code: string): Promise<void> {
    this.drafts.set(this.draftKey(userId, lessonId), code)
  }

  async getDraft(userId: string, lessonId: string): Promise<string | null> {
    return this.drafts.get(this.draftKey(userId, lessonId)) ?? null
  }

  async markComplete(_userId: string, _lessonId: string): Promise<{ completed: boolean }> {
    return { completed: true }
  }

  private draftKey(userId: string, lessonId: string): string {
    return `${userId}::${lessonId}`
  }
}

export class PrismaProgressRepository implements ProgressRepository {
  async saveDraft(userId: string, lessonId: string, code: string): Promise<void> {
    await db.courseTaskAttempt.upsert({
      where: { courseTaskId_userId: { courseTaskId: lessonId, userId } },
      update: { currentData: { code } },
      create: { courseTaskId: lessonId, userId, currentData: { code } }
    })
  }

  async getDraft(userId: string, lessonId: string): Promise<string | null> {
    const attempt = await db.courseTaskAttempt.findUnique({
      where: { courseTaskId_userId: { courseTaskId: lessonId, userId } }
    })
    if (!attempt) return null
    const data = attempt.currentData as { code?: string } | null
    return data?.code ?? null
  }

  async markComplete(userId: string, lessonId: string): Promise<{ completed: boolean }> {
    return db.$transaction(async tx => {
      const attempt = await tx.courseTaskAttempt.upsert({
        where: { courseTaskId_userId: { courseTaskId: lessonId, userId } },
        update: { status: 'SUCCESS' },
        create: { courseTaskId: lessonId, userId, status: 'SUCCESS' }
      })
      const task = await tx.courseTask.findUnique({
        where: { id: lessonId },
        include: { module: { include: { course: true } } }
      })
      if (task) {
        await this.upsertEnrollmentProgress(tx, userId, task.module.course.id, lessonId)
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
