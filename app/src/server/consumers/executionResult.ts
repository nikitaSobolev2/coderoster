import 'server-only'
import { db } from '~/server/db'
import { startConsumer } from '~/server/amqp/consumer'
import { cache } from '~/server/cache'
import { cacheKeys } from '~/server/repositories/cached'
import {
  EXECUTION_COMPLETED_TOPIC,
  executionCompletedSchema,
  type ExecutionCompleted
} from '~/shared/contracts/execution'

const QUEUE = 'execution.completed'

/**
 * Consumes terminal execution events emitted by the Go worker. Persists the
 * result, advances `CourseTaskAttempt`, recomputes enrollment progress, logs
 * an activity row, and invalidates the relevant cache entries.
 */
async function handleEvent(payload: unknown): Promise<void> {
  const event = executionCompletedSchema.parse(payload)
  const execution = await db.execution.findUnique({ where: { id: event.executionId } })
  if (!execution) {
    console.warn('[consumer] unknown execution', event.executionId)
    return
  }

  await db.$transaction(async tx => {
    await tx.execution.update({
      where: { id: event.executionId },
      data: {
        status: mapStatus(event.status),
        finishedAt: new Date(),
        stdout: event.stdout,
        stderr: event.stderr,
        runtimeMs: event.runtimeMs,
        passed: event.passed,
        testResults: event.testResults,
        errorMessage: event.errorMessage
      }
    })

    if (!event.passed) return

    const attempt = await tx.courseTaskAttempt.upsert({
      where: {
        courseTaskId_userId: { courseTaskId: execution.taskId, userId: execution.userId }
      },
      update: {
        status: 'SUCCESS',
        tryN: { increment: 1 },
        currentData: { code: execution.code }
      },
      create: {
        courseTaskId: execution.taskId,
        userId: execution.userId,
        status: 'SUCCESS',
        tryN: 1,
        currentData: { code: execution.code }
      }
    })

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

    await advanceEnrollment(tx, execution.userId, execution.taskId)
  })

  await invalidateCaches(execution.userId)
}

async function advanceEnrollment(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  userId: string,
  taskId: string
) {
  const task = await tx.courseTask.findUnique({
    where: { id: taskId },
    include: { module: { include: { course: true } } }
  })
  if (!task) return
  const enrollment = await tx.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: task.module.course.id } }
  })
  if (!enrollment) return
  const completed = enrollment.completedLessonIds.includes(taskId)
    ? enrollment.completedLessonIds
    : [...enrollment.completedLessonIds, taskId]
  const totalTasks = await tx.courseTask.count({
    where: { module: { courseId: task.module.course.id } }
  })
  const percent = totalTasks === 0 ? 0 : Math.round((completed.length / totalTasks) * 100)
  const isComplete = percent >= 100
  await tx.enrollment.update({
    where: { id: enrollment.id },
    data: {
      completedLessonIds: completed,
      progressPercent: percent,
      status: isComplete ? 'FINISHED' : enrollment.status,
      finishedAt: isComplete ? new Date() : enrollment.finishedAt
    }
  })
}

async function invalidateCaches(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { username: true }
  })
  if (!user) return
  await Promise.all([
    cache.del(cacheKeys.profile(user.username, userId)),
    cache.del(cacheKeys.profile(user.username, null)),
    cache.del(cacheKeys.achievements(user.username)),
    cache.delPrefix(`activity:${user.username}:`)
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

void EXECUTION_COMPLETED_TOPIC
