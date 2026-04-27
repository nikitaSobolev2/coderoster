import 'server-only'
import type { CourseTask, WeeklyChallenge } from '@prisma/client'
import { db } from '~/server/db'

const TASK_COUNT = 5

/**
 * Weekly challenge lifecycle. Pool of 5 tougher tasks per ISO week, rolling
 * over Monday 00:00 UTC. Mirrors `DailyChallengeService` shape so the UI can
 * keep a single mental model.
 */
export class WeeklyChallengeService {
  async getOrCreateCurrent(now: Date = new Date()): Promise<WeeklyChallenge> {
    const isoWeek = computeIsoWeek(now)
    const existing = await db.weeklyChallenge.findUnique({ where: { isoWeek } })
    if (existing) return existing
    const taskIds = await this.pickTaskIds()
    return db.weeklyChallenge.create({ data: { isoWeek, taskIds } })
  }

  async listTasksFor(challenge: WeeklyChallenge): Promise<CourseTask[]> {
    if (challenge.taskIds.length === 0) return []
    const tasks = await db.courseTask.findMany({ where: { id: { in: challenge.taskIds } } })
    const byId = new Map(tasks.map(task => [task.id, task]))
    return challenge.taskIds
      .map(id => byId.get(id) ?? null)
      .filter((task): task is CourseTask => task !== null)
  }

  async findTaskAtIndex(isoWeek: string, taskIndex: number): Promise<CourseTask | null> {
    const challenge = await db.weeklyChallenge.findUnique({ where: { isoWeek } })
    if (!challenge) return null
    const taskId = challenge.taskIds[taskIndex]
    if (!taskId) return null
    return db.courseTask.findUnique({ where: { id: taskId } })
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
    const challenge = await db.weeklyChallenge.findUnique({ where: { isoWeek } })
    if (!challenge) return false
    const cleared = await db.weeklyChallengeAttempt.count({
      where: { userId, isoWeek, status: 'SUCCESS' }
    })
    return cleared >= challenge.taskIds.length
  }

  private async pickTaskIds(): Promise<string[]> {
    const candidates = await db.courseTask.findMany({
      where: {
        kind: 'TASK',
        module: {
          course: { difficulty: { in: ['intermediate', 'advanced'] }, status: 'PUBLISHED' }
        }
      },
      select: { id: true },
      take: 50
    })
    if (candidates.length === 0) return []
    const shuffled = [...candidates].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, TASK_COUNT).map(row => row.id)
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
