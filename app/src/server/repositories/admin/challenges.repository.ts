import 'server-only'
import { TaskKind } from '@prisma/client'
import { db } from '~/server/db'
import {
  createAutotest as createAutotestHelper,
  createOwnedTask,
  deleteAutotest as deleteAutotestHelper,
  deleteOwnedTask,
  reorderAutotests as reorderAutotestsHelper,
  reorderOwnedTasks,
  updateAutotest as updateAutotestHelper,
  updateOwnedTask,
  type OwnedAutotestUpsertInput,
  type OwnedTaskCreateInput,
  type OwnedTaskUpdateInput
} from './_shared/ownedTaskOps'

/* ----- shared shapes ----------------------------------------------------- */

export interface AdminChallengeAutotest {
  id: string
  order: number
  name: string
  input: string | null
  expected: string
  hidden: boolean
}

export interface AdminChallengeTask {
  id: string
  order: number
  title: string
  summary: string
  description: string
  kind: TaskKind
  estimatedMinutes: number
  allowedLanguages: string[]
  initialData: Record<string, unknown>
  result: Record<string, unknown> | null
  autotests: AdminChallengeAutotest[]
}

/* ----- daily ------------------------------------------------------------- */

export interface AdminDailyRow {
  id: string
  date: string
  taskCount: number
  attemptCount: number
  createdAt: Date
}

export interface AdminDailyDetail {
  id: string
  date: string
  createdAt: Date
  tasks: AdminChallengeTask[]
}

/* ----- weekly ------------------------------------------------------------ */

export interface AdminWeeklyRow {
  id: string
  isoWeek: string
  taskCount: number
  attemptCount: number
  createdAt: Date
}

export interface AdminWeeklyDetail {
  id: string
  isoWeek: string
  createdAt: Date
  tasks: AdminChallengeTask[]
}

/**
 * Daily / weekly challenges OWN their tasks (1:N via `CourseTask.dailyChallengeId`
 * / `CourseTask.weeklyChallengeId`). Repository shape mirrors the course
 * editor (tree → tasks → autotests) so the same admin UI primitives can drive
 * both.
 */
export class AdminChallengesRepository {
  /* ---- Daily ---- */

  async listDaily(): Promise<AdminDailyRow[]> {
    const rows = await db.dailyChallenge.findMany({
      include: { _count: { select: { attempts: true, tasks: true } } },
      orderBy: { date: 'desc' },
      take: 200
    })
    return rows.map(row => ({
      id: row.id,
      date: row.date,
      taskCount: row._count.tasks,
      attemptCount: row._count.attempts,
      createdAt: row.createdAt
    }))
  }

  async getDaily(id: string): Promise<AdminDailyDetail> {
    const row = await db.dailyChallenge.findUniqueOrThrow({
      where: { id },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
          include: { autotests: { orderBy: { order: 'asc' } } }
        }
      }
    })
    return {
      id: row.id,
      date: row.date,
      createdAt: row.createdAt,
      tasks: row.tasks.map(toChallengeTask)
    }
  }

  async createDaily(date: string): Promise<string> {
    const created = await db.dailyChallenge.create({ data: { date } })
    return created.id
  }

  async deleteDaily(id: string): Promise<void> {
    await db.dailyChallenge.delete({ where: { id } })
  }

  createDailyTask(dailyChallengeId: string, input: OwnedTaskCreateInput): Promise<string> {
    return createOwnedTask({ kind: 'DAILY', dailyChallengeId }, input)
  }

  updateChallengeTask(taskId: string, input: OwnedTaskUpdateInput): Promise<void> {
    return updateOwnedTask(taskId, input)
  }

  deleteChallengeTask(taskId: string): Promise<void> {
    return deleteOwnedTask(taskId)
  }

  reorderDailyTasks(dailyChallengeId: string, orderedIds: string[]): Promise<void> {
    return reorderOwnedTasks({ kind: 'DAILY', dailyChallengeId }, orderedIds)
  }

  /* ---- Weekly ---- */

  async listWeekly(): Promise<AdminWeeklyRow[]> {
    const rows = await db.weeklyChallenge.findMany({
      include: { _count: { select: { attempts: true, tasks: true } } },
      orderBy: { isoWeek: 'desc' },
      take: 200
    })
    return rows.map(row => ({
      id: row.id,
      isoWeek: row.isoWeek,
      taskCount: row._count.tasks,
      attemptCount: row._count.attempts,
      createdAt: row.createdAt
    }))
  }

  async getWeekly(id: string): Promise<AdminWeeklyDetail> {
    const row = await db.weeklyChallenge.findUniqueOrThrow({
      where: { id },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
          include: { autotests: { orderBy: { order: 'asc' } } }
        }
      }
    })
    return {
      id: row.id,
      isoWeek: row.isoWeek,
      createdAt: row.createdAt,
      tasks: row.tasks.map(toChallengeTask)
    }
  }

  async createWeekly(isoWeek: string): Promise<string> {
    const created = await db.weeklyChallenge.create({ data: { isoWeek } })
    return created.id
  }

  async deleteWeekly(id: string): Promise<void> {
    await db.weeklyChallenge.delete({ where: { id } })
  }

  createWeeklyTask(weeklyChallengeId: string, input: OwnedTaskCreateInput): Promise<string> {
    return createOwnedTask({ kind: 'WEEKLY', weeklyChallengeId }, input)
  }

  reorderWeeklyTasks(weeklyChallengeId: string, orderedIds: string[]): Promise<void> {
    return reorderOwnedTasks({ kind: 'WEEKLY', weeklyChallengeId }, orderedIds)
  }

  /* ---- Autotests (owner-agnostic) ---- */

  createAutotest(taskId: string, input: OwnedAutotestUpsertInput): Promise<string> {
    return createAutotestHelper(taskId, input)
  }

  updateAutotest(autotestId: string, input: Partial<OwnedAutotestUpsertInput>): Promise<void> {
    return updateAutotestHelper(autotestId, input)
  }

  deleteAutotest(autotestId: string): Promise<void> {
    return deleteAutotestHelper(autotestId)
  }

  reorderAutotests(taskId: string, orderedIds: string[]): Promise<void> {
    return reorderAutotestsHelper(taskId, orderedIds)
  }
}

function toChallengeTask(task: {
  id: string
  order: number
  title: string
  summary: string
  description: string
  kind: TaskKind
  estimatedMinutes: number
  allowedLanguages: string[]
  initialData: unknown
  result: unknown
  autotests: {
    id: string
    order: number
    name: string
    input: string | null
    expected: string
    hidden: boolean
  }[]
}): AdminChallengeTask {
  return {
    id: task.id,
    order: task.order,
    title: task.title,
    summary: task.summary,
    description: task.description,
    kind: task.kind,
    estimatedMinutes: task.estimatedMinutes,
    allowedLanguages: task.allowedLanguages,
    initialData: (task.initialData ?? {}) as Record<string, unknown>,
    result: (task.result ?? null) as Record<string, unknown> | null,
    autotests: task.autotests.map(a => ({
      id: a.id,
      order: a.order,
      name: a.name,
      input: a.input,
      expected: a.expected,
      hidden: a.hidden
    }))
  }
}
