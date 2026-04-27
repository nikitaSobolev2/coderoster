import 'server-only'
import type { CourseTask, DailyChallenge } from '@prisma/client'
import { db } from '~/server/db'

const DIFFICULTIES: ReadonlyArray<'beginner' | 'intermediate' | 'advanced'> = [
  'beginner',
  'intermediate',
  'advanced'
]

/**
 * Owns the daily challenge lifecycle: rollover at 00:00 UTC, attempt
 * upserts on submit, and aggregated streak / clear queries used by the UI.
 */
export class DailyChallengeService {
  async getOrCreateToday(now: Date = new Date()): Promise<DailyChallenge> {
    const date = isoDay(now)
    const existing = await db.dailyChallenge.findUnique({ where: { date } })
    if (existing) return existing
    const taskIds = await this.pickTaskIds()
    return db.dailyChallenge.create({ data: { date, taskIds } })
  }

  async listTasksFor(challenge: DailyChallenge): Promise<CourseTask[]> {
    if (challenge.taskIds.length === 0) return []
    const tasks = await db.courseTask.findMany({
      where: { id: { in: challenge.taskIds } }
    })
    const byId = new Map(tasks.map(task => [task.id, task]))
    return challenge.taskIds
      .map(id => byId.get(id) ?? null)
      .filter((task): task is CourseTask => task !== null)
  }

  async findTaskAtIndex(date: string, taskIndex: number): Promise<CourseTask | null> {
    const challenge = await db.dailyChallenge.findUnique({ where: { date } })
    if (!challenge) return null
    const taskId = challenge.taskIds[taskIndex]
    if (!taskId) return null
    return db.courseTask.findUnique({ where: { id: taskId } })
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
    const challenge = await db.dailyChallenge.findUnique({ where: { date } })
    if (!challenge) return false
    const cleared = await db.dailyChallengeAttempt.count({
      where: { userId, date, status: 'SUCCESS' }
    })
    return cleared >= challenge.taskIds.length
  }

  private async pickTaskIds(): Promise<string[]> {
    const ids: string[] = []
    for (const difficulty of DIFFICULTIES) {
      const candidates = await db.courseTask.findMany({
        where: {
          kind: 'TASK',
          module: { course: { difficulty, status: 'PUBLISHED' } }
        },
        select: { id: true },
        take: 25
      })
      if (candidates.length === 0) continue
      const pick = candidates[Math.floor(Math.random() * candidates.length)]
      if (pick) ids.push(pick.id)
    }
    return ids
  }
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export const dailyChallengeService = new DailyChallengeService()
