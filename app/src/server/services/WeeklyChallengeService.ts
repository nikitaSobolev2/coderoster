import 'server-only'
import type { CourseTask, WeeklyChallenge } from '@prisma/client'
import { db } from '~/server/db'

/**
 * Weekly challenge lifecycle. Mirrors `DailyChallengeService` shape so the
 * UI keeps a single mental model. Tasks live on the challenge via
 * `CourseTask.weeklyChallengeId` — admins author them in the weekly editor.
 */
export class WeeklyChallengeService {
  async getOrCreateCurrent(now: Date = new Date()): Promise<WeeklyChallenge> {
    const isoWeek = computeIsoWeek(now)
    const existing = await db.weeklyChallenge.findUnique({ where: { isoWeek } })
    if (existing) return existing
    return db.weeklyChallenge.create({ data: { isoWeek } })
  }

  async listTasksFor(challenge: WeeklyChallenge): Promise<CourseTask[]> {
    return db.courseTask.findMany({
      where: { weeklyChallengeId: challenge.id },
      orderBy: { order: 'asc' }
    })
  }

  async findTaskAtIndex(isoWeek: string, taskIndex: number): Promise<CourseTask | null> {
    const challenge = await db.weeklyChallenge.findUnique({ where: { isoWeek } })
    if (!challenge) return null
    return db.courseTask.findFirst({
      where: { weeklyChallengeId: challenge.id },
      orderBy: { order: 'asc' },
      skip: taskIndex,
      take: 1
    })
  }

  async recordExecutionStart(input: {
    userId: string
    isoWeek: string
    taskIndex: number
    executionId: string
  }): Promise<void> {
    await db.weeklyChallengeAttempt.upsert({
      where: {
        userId_isoWeek_taskIndex: {
          userId: input.userId,
          isoWeek: input.isoWeek,
          taskIndex: input.taskIndex
        }
      },
      update: { executionId: input.executionId },
      create: {
        userId: input.userId,
        isoWeek: input.isoWeek,
        taskIndex: input.taskIndex,
        executionId: input.executionId
      }
    })
  }

  async markSolved(input: { userId: string; isoWeek: string; taskIndex: number }): Promise<void> {
    await db.weeklyChallengeAttempt.upsert({
      where: {
        userId_isoWeek_taskIndex: {
          userId: input.userId,
          isoWeek: input.isoWeek,
          taskIndex: input.taskIndex
        }
      },
      update: { status: 'SUCCESS', solvedAt: new Date() },
      create: {
        userId: input.userId,
        isoWeek: input.isoWeek,
        taskIndex: input.taskIndex,
        status: 'SUCCESS',
        solvedAt: new Date()
      }
    })
  }

  async hasFullClear(userId: string, isoWeek: string): Promise<boolean> {
    const challenge = await db.weeklyChallenge.findUnique({
      where: { isoWeek },
      include: { _count: { select: { tasks: true } } }
    })
    if (!challenge || challenge._count.tasks === 0) return false
    const cleared = await db.weeklyChallengeAttempt.count({
      where: { userId, isoWeek, status: 'SUCCESS' }
    })
    return cleared >= challenge._count.tasks
  }
}

export function computeIsoWeek(date: Date): string {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNumber = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNumber + 3)
  const firstThursday = Date.UTC(target.getUTCFullYear(), 0, 4)
  const week =
    1 +
    Math.round(
      ((target.getTime() - firstThursday) / 86_400_000 - 3 + (((firstThursday % 7) + 7) % 7)) / 7
    )
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export const weeklyChallengeService = new WeeklyChallengeService()
