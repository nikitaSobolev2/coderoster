import 'server-only'
import type { Prisma } from '@prisma/client'
import { db } from '~/server/db'
import { startConsumer } from '~/server/amqp/consumer'
import { cache } from '~/server/cache'
import { invalidateProfileCachesForUsername } from '~/server/cache/invalidateProfileCaches'
import { requiredTierForTask } from '~/shared/lib/planTier'
import { achievementService } from '~/server/services/AchievementService'
import { dailyChallengeService } from '~/server/services/DailyChallengeService'
import { planService } from '~/server/services/PlanService'
import { streakService } from '~/server/services/StreakService'
import { xpService, type XpSource } from '~/server/services/XpService'
import { weeklyChallengeService } from '~/server/services/WeeklyChallengeService'
import {
  EXECUTION_COMPLETED_TOPIC,
  executionCompletedSchema,
  type ExecutionCompleted
} from '~/shared/contracts/execution'
import type { Language } from '~/server/repositories/types'
import { mergeDraftSave } from '~/shared/lib/taskAttemptCurrentData'

const QUEUE = 'execution.completed'

type Tx = Prisma.TransactionClient

/**
 * Consumes terminal execution events emitted by the Go worker. The flow
 * branches on `mode`:
 *
 * - `run`  — persist the execution row and stop. No graded side effects, no
 *            tryN bump, no achievement triggers. Pure preview.
 * - `submit` — persist + bump tryN. On `passed`: mark attempt SUCCESS,
 *            advance enrollment, record activity, award XP, tick streak,
 *            evaluate achievements, advance daily/weekly challenges.
 */
async function handleEvent(payload: unknown): Promise<void> {
  const parsed = executionCompletedSchema.safeParse(payload)
  if (!parsed.success) {
    console.error('[consumer] execution.completed Zod error', parsed.error.flatten(), payload)
    throw new Error('invalid execution.completed payload')
  }
  const event = parsed.data
  const execution = await db.execution.findUnique({ where: { id: event.executionId } })
  if (!execution) {
    console.warn('[consumer] unknown execution', event.executionId)
    return
  }

  const isSubmit = event.mode === 'submit'

  await db.execution.update({
    where: { id: event.executionId },
    data: {
      status: mapStatus(event.status),
      finishedAt: new Date(),
      stdout: event.stdout,
      stderr: event.stderr,
      runtimeMs: event.runtimeMs,
      passed: isSubmit ? event.passed : null,
      testResults: event.testResults,
      errorMessage: event.errorMessage
    }
  })

  if (!isSubmit) {
    await invalidateCaches(execution.userId)
    return
  }

  try {
    await db.$transaction(async tx => {
      if (!execution.taskId) {
        await handleChallengeOnly({ tx, execution, event })
        return
      }
      await handleSubmitForTask({ tx, execution, event })
    })
  } catch (error) {
    console.error(
      '[consumer] submit side-effects failed (execution row already saved)',
      event.executionId,
      error
    )
  }

  await invalidateCaches(execution.userId)
}

interface SubmitContext {
  tx: Tx
  execution: NonNullable<Awaited<ReturnType<typeof db.execution.findUnique>>>
  event: ExecutionCompleted
}

async function handleSubmitForTask(ctx: SubmitContext): Promise<void> {
  const { tx, execution, event } = ctx
  if (!execution.taskId) return

  const prevRow = await tx.courseTaskAttempt.findUnique({
    where: {
      courseTaskId_userId: { courseTaskId: execution.taskId, userId: execution.userId }
    },
    select: { currentData: true }
  })
  const lang = execution.language as Language
  const merged = mergeDraftSave(prevRow?.currentData, lang, execution.code) as Prisma.InputJsonValue

  const attempt = await tx.courseTaskAttempt.upsert({
    where: {
      courseTaskId_userId: { courseTaskId: execution.taskId, userId: execution.userId }
    },
    update: {
      status: event.passed ? 'SUCCESS' : 'ACTIVE',
      tryN: { increment: 1 },
      currentData: merged
    },
    create: {
      courseTaskId: execution.taskId,
      userId: execution.userId,
      status: event.passed ? 'SUCCESS' : 'ACTIVE',
      tryN: 1,
      currentData: merged
    }
  })

  if (!event.passed) return

  await tx.userActivity.create({
    data: {
      userId: execution.userId,
      type: 'lesson.passed',
      payload: {
        taskId: execution.taskId,
        executionId: execution.id,
        attemptId: attempt.id
      }
    }
  })

  await xpService.award(execution.userId, 'lesson.passed', tx)
  const finishedCourse = await advanceEnrollment(tx, execution.userId, execution.taskId)
  if (finishedCourse) {
    await xpService.award(execution.userId, 'course.finished', tx)
  }
  await streakService.tick(execution.userId, new Date(), tx)
  await runAchievements(tx, execution.userId, 'lesson.passed', {
    taskId: execution.taskId,
    runtimeMs: execution.runtimeMs ?? 0,
    passed: true,
    at: new Date()
  })
  if (finishedCourse) {
    await runAchievements(tx, execution.userId, 'course.finished', {})
  }

  await advanceChallenges(ctx)
}

async function handleChallengeOnly(ctx: SubmitContext): Promise<void> {
  if (!ctx.event.passed) return
  await ctx.tx.userActivity.create({
    data: {
      userId: ctx.execution.userId,
      type: 'lesson.passed',
      payload: { executionId: ctx.execution.id }
    }
  })
  await advanceChallenges(ctx)
}

async function advanceChallenges(ctx: SubmitContext): Promise<void> {
  const { tx, execution, event } = ctx
  if (!event.passed) return
  if (execution.contextKind === 'DAILY' && execution.contextRef) {
    const [date, indexStr] = execution.contextRef.split('#')
    const taskIndex = Number(indexStr)
    if (date && Number.isFinite(taskIndex)) {
      await dailyChallengeService.markSolved({
        userId: execution.userId,
        date,
        taskIndex
      })
      await runAchievements(tx, execution.userId, 'daily.cleared', { at: new Date() })
      const fullClear = await dailyChallengeService.hasFullClear(execution.userId, date)
      if (fullClear) {
        await xpService.award(execution.userId, 'daily.cleared', tx)
        await streakService.tick(execution.userId, new Date(), tx)
      }
    }
  }
  if (execution.contextKind === 'WEEKLY' && execution.contextRef) {
    const [isoWeek, indexStr] = execution.contextRef.split('#')
    const taskIndex = Number(indexStr)
    if (isoWeek && Number.isFinite(taskIndex)) {
      await weeklyChallengeService.markSolved({
        userId: execution.userId,
        isoWeek,
        taskIndex
      })
      const fullClear = await weeklyChallengeService.hasFullClear(execution.userId, isoWeek)
      if (fullClear) {
        await xpService.award(execution.userId, 'weekly.cleared', tx)
        await runAchievements(tx, execution.userId, 'weekly.cleared', {})
      }
    }
  }
}

async function runAchievements(
  tx: Tx,
  userId: string,
  trigger: Parameters<typeof achievementService.evaluate>[0]['trigger'],
  payload: Record<string, unknown>
) {
  await achievementService.evaluate({ userId, trigger, payload, tx })
}

async function advanceEnrollment(tx: Tx, userId: string, taskId: string): Promise<boolean> {
  const task = await tx.courseTask.findUnique({
    where: { id: taskId },
    include: { module: { include: { course: true } } }
  })
  if (!task?.module) return false
  const course = task.module.course
  const courseId = course.id
  const enrollment = await tx.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } }
  })
  if (!enrollment) return false

  const tier = await planService.getEffectiveTier(userId, tx)
  const modules = await tx.courseModule.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: { tasks: { orderBy: { order: 'asc' } } }
  })
  const accessibleIds: string[] = []
  for (const mod of modules) {
    for (const t of mod.tasks) {
      const need = requiredTierForTask(course.tierRequired, {
        isPremium: t.isPremium,
        minPlanTier: t.minPlanTier
      })
      if (tier >= need) accessibleIds.push(t.id)
    }
  }

  const completedIds = enrollment.completedLessonIds.includes(taskId)
    ? enrollment.completedLessonIds
    : [...enrollment.completedLessonIds, taskId]

  const completedAccessible = completedIds.filter(id => accessibleIds.includes(id)).length
  const totalAccessible = accessibleIds.length
  const percent =
    totalAccessible === 0 ? 0 : Math.round((completedAccessible / totalAccessible) * 100)
  const allAccessibleDone = totalAccessible > 0 && completedAccessible >= totalAccessible
  const isComplete = allAccessibleDone && enrollment.status !== 'FINISHED'

  const nextLessonId = await planService.findNextAccessibleLessonIdAfterTask(
    courseId,
    userId,
    taskId,
    tx
  )

  await tx.enrollment.update({
    where: { id: enrollment.id },
    data: {
      completedLessonIds: completedIds,
      progressPercent: percent,
      status: allAccessibleDone ? 'FINISHED' : enrollment.status,
      finishedAt: allAccessibleDone ? (enrollment.finishedAt ?? new Date()) : enrollment.finishedAt,
      currentLessonId: nextLessonId
    }
  })
  return isComplete
}

async function invalidateCaches(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { username: true }
  })
  if (!user) return
  await Promise.all([
    invalidateProfileCachesForUsername(user.username),
    cache.delPrefix('leaderboard:')
  ])
}

function mapStatus(
  status: ExecutionCompleted['status']
): 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CANCELLED' {
  switch (status) {
    case 'success':
      return 'SUCCESS'
    case 'timeout':
      return 'TIMEOUT'
    case 'cancelled':
      return 'CANCELLED'
    default:
      return 'FAILED'
  }
}

void EXECUTION_COMPLETED_TOPIC
void ([] as XpSource[]) // keep typing import alive

export async function runResultConsumer(): Promise<void> {
  console.log('[consumer] result-consumer starting')
  await startConsumer({ queue: QUEUE, prefetch: 8 }, handleEvent)
}

if (import.meta.url.startsWith('file:') && process.argv[1]?.endsWith('executionResult.ts')) {
  runResultConsumer().catch(error => {
    console.error('[consumer] fatal', error)
    process.exit(1)
  })
}
