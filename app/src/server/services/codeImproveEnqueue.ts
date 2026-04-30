import 'server-only'
import { createHash } from 'crypto'
import type { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { db } from '~/server/db'
import { assertAiImproveCircuitClosed } from '~/server/services/aiImproveAvailability'
import { planService } from '~/server/services/PlanService'
import type { Language } from '~/server/repositories/types'
import { AI_CODE_IMPROVE_TOPIC } from '~/shared/contracts/aiCodeImprove'

export function buildAiImproveFingerprint(
  userId: string,
  taskId: string,
  language: Language,
  dedupeKey: string
): string {
  return createHash('sha256')
    .update(`${userId}::${taskId}::${language}::${dedupeKey}`)
    .digest('hex')
}

export async function enqueueCodeImproveJob(input: {
  userId: string
  taskId: string
  language: Language
  dedupeKey: string
  /** PLATFORM `ADMIN` role — skips paid-plan check (dev / staff testing). */
  bypassPaidTier?: boolean
}): Promise<{ jobId: string }> {
  await assertAiImproveCircuitClosed()

  const tier = await planService.getEffectiveTier(input.userId)
  if (tier <= 0 && !input.bypassPaidTier) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'ИИ-разбор доступен на платном плане.'
    })
  }

  const fingerprint = buildAiImproveFingerprint(
    input.userId,
    input.taskId,
    input.language,
    input.dedupeKey
  )

  const attempt = await db.courseTaskAttempt.findUnique({
    where: {
      courseTaskId_userId: { courseTaskId: input.taskId, userId: input.userId }
    },
    select: { status: true }
  })
  if (attempt?.status !== 'SUCCESS') {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Сначала успешно сдай задание — потом можно улучшить код с ИИ.'
    })
  }

  const task = await db.courseTask.findFirst({
    where: { id: input.taskId },
    include: {
      module: { include: { course: true } },
      dailyChallenge: { select: { id: true } },
      weeklyChallenge: { select: { id: true } }
    }
  })
  if (!task) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Задание не найдено.' })
  }

  const courseId = task.module?.course?.id
  if (!courseId) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'ИИ-разбор сейчас только для заданий из курсов (не дейлики и не спидраны).'
    })
  }

  try {
    return await db.$transaction(async tx => {
      const existing = await tx.aiCodeImproveJob.findUnique({
        where: {
          userId_idempotencyFingerprint: {
            userId: input.userId,
            idempotencyFingerprint: fingerprint
          }
        }
      })
      if (existing) return { jobId: existing.id }

      const job = await tx.aiCodeImproveJob.create({
        data: {
          userId: input.userId,
          taskId: input.taskId,
          courseId,
          language: input.language,
          idempotencyFingerprint: fingerprint,
          status: 'QUEUED'
        }
      })
      await tx.outboxEvent.create({
        data: {
          topic: AI_CODE_IMPROVE_TOPIC,
          payload: { jobId: job.id } as unknown as Prisma.InputJsonValue
        }
      })
      return { jobId: job.id }
    })
  } catch (error: unknown) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
    if (code === 'P2002') {
      const row = await db.aiCodeImproveJob.findUnique({
        where: {
          userId_idempotencyFingerprint: {
            userId: input.userId,
            idempotencyFingerprint: fingerprint
          }
        },
        select: { id: true }
      })
      if (row) return { jobId: row.id }
    }
    throw error
  }
}
