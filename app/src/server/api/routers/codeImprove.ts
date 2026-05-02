import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { adminProcedure, aiImproveProcedure } from '~/server/api/procedures'
import { db } from '~/server/db'
import { enqueueCodeImproveJob } from '~/server/services/codeImproveEnqueue'
import { AI_CODE_IMPROVE_TOPIC } from '~/shared/contracts/aiCodeImprove'

const languageSchema = z.enum(['python', 'php'])

export const codeImproveRouter = createTRPCRouter({
  start: aiImproveProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
        language: languageSchema,
        dedupeKey: z.string().uuid()
      })
    )
    .mutation(({ ctx, input }) =>
      enqueueCodeImproveJob({
        userId: ctx.user.id,
        taskId: input.taskId,
        language: input.language,
        dedupeKey: input.dedupeKey,
        bypassPaidTier: ctx.user.role === 'admin'
      })
    ),

  getJob: protectedProcedure
    .input(z.object({ jobId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const row = await db.aiCodeImproveJob.findFirst({
        where: { id: input.jobId, userId: ctx.user.id },
        select: {
          id: true,
          status: true,
          improvedCode: true,
          explanationMarkdown: true,
          errorCode: true,
          openaiModelUsed: true,
          finishedAt: true,
          createdAt: true,
          language: true
        }
      })
      return row
    }),

  latestForTask: protectedProcedure
    .input(z.object({ taskId: z.string().min(1), language: languageSchema }))
    .query(async ({ ctx, input }) => {
      return db.aiCodeImproveJob.findFirst({
        where: {
          userId: ctx.user.id,
          taskId: input.taskId,
          language: input.language,
          status: 'DONE'
        },
        orderBy: { finishedAt: 'desc' },
        select: {
          id: true,
          language: true,
          improvedCode: true,
          explanationMarkdown: true,
          finishedAt: true
        }
      })
    }),

  /**
   * Staff-only: re-queue the learner's latest completed job for this task+language,
   * clearing stored output so the worker replaces it in the same row.
   */
  regenerateLatest: adminProcedure
    .input(z.object({ taskId: z.string().min(1), language: languageSchema }))
    .mutation(async ({ ctx, input }) => {
      const job = await db.aiCodeImproveJob.findFirst({
        where: {
          userId: ctx.user.id,
          taskId: input.taskId,
          language: input.language,
          status: 'DONE'
        },
        orderBy: { finishedAt: 'desc' },
        select: { id: true }
      })
      if (!job) {
        return { jobId: null as string | null }
      }
      await db.$transaction([
        db.aiCodeImproveJob.update({
          where: { id: job.id },
          data: {
            status: 'QUEUED',
            improvedCode: '',
            explanationMarkdown: '',
            errorCode: null,
            finishedAt: null,
            openaiModelUsed: null
          }
        }),
        db.outboxEvent.create({
          data: {
            topic: AI_CODE_IMPROVE_TOPIC,
            payload: { jobId: job.id }
          }
        })
      ])
      return { jobId: job.id }
    })
})
