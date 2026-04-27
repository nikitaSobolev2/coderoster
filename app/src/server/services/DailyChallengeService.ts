import 'server-only'
import type { CourseTask, DailyChallenge } from '@prisma/client'
import { db } from '~/server/db'

/**
 * Owns the daily challenge lifecycle: rollover at 00:00 UTC, attempt
 * upserts on submit, and aggregated streak / clear queries used by the UI.
 *
 * Tasks live on the challenge directly via `CourseTask.dailyChallengeId` —
 * admins author them through the daily editor, the same way they author
 * tasks under a course module. Empty challenges (no tasks yet) are valid
 * and simply render as "no tasks today" on the learner side.
 */
export class DailyChallengeService {
  async getOrCreateToday(now: Date = new Date()): Promise<DailyChallenge> {
    const date = isoDay(now)
    const existing = await db.dailyChallenge.findUnique({ where: { date } })
    if (existing) return existing
    return db.dailyChallenge.create({ data: { date } })
  }

  async listTasksFor(challenge: DailyChallenge): Promise<CourseTask[]> {
    return db.courseTask.findMany({
      where: { dailyChallengeId: challenge.id },
      orderBy: { order: 'asc' }
    })
  }

  async findTaskAtIndex(date: string, taskIndex: number): Promise<CourseTask | null> {
    const challenge = await db.dailyChallenge.findUnique({ where: { date } })
    if (!challenge) return null
    return db.courseTask.findFirst({
      where: { dailyChallengeId: challenge.id },
      orderBy: { order: 'asc' },
      skip: taskIndex,
      take: 1
    })
  }

  async recordExecutionStart(input: {
    userId: string
    date: string
    taskIndex: number
    executionId: string
  }): Promise<void> {
    await db.dailyChallengeAttempt.upsert({
      where: {
        userId_date_taskIndex: {
          userId: input.userId,
          date: input.date,
          taskIndex: input.taskIndex
        }
      },
      update: { executionId: input.executionId },
      create: {
        userId: input.userId,
        date: input.date,
        taskIndex: input.taskIndex,
        executionId: input.executionId
      }
    })
  }

  async markSolved(input: { userId: string; date: string; taskIndex: number }): Promise<void> {
    await db.dailyChallengeAttempt.upsert({
      where: {
        userId_date_taskIndex: {
          userId: input.userId,
          date: input.date,
          taskIndex: input.taskIndex
        }
      },
      update: { status: 'SUCCESS', solvedAt: new Date() },
      create: {
        userId: input.userId,
        date: input.date,
        taskIndex: input.taskIndex,
        status: 'SUCCESS',
        solvedAt: new Date()
      }
    })
  }

  async hasFullClear(userId: string, date: string): Promise<boolean> {
    const challenge = await db.dailyChallenge.findUnique({
      where: { date },
      include: { _count: { select: { tasks: true } } }
    })
    if (!challenge || challenge._count.tasks === 0) return false
    const cleared = await db.dailyChallengeAttempt.count({
      where: { userId, date, status: 'SUCCESS' }
    })
    return cleared >= challenge._count.tasks
  }
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export const dailyChallengeService = new DailyChallengeService()
