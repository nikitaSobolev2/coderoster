import 'server-only'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'
import { heavyProcedure } from '~/server/api/procedures'
import { db } from '~/server/db'
import { computeIsoWeek, weeklyChallengeService } from '~/server/services/WeeklyChallengeService'

const submitInputSchema = z.object({
  taskIndex: z.number().int().min(0).max(4),
  language: z.enum(['python', 'php']),
  code: z.string().max(50_000)
})

export const weeklyRouter = createTRPCRouter({
  getCurrent: publicProcedure.query(async ({ ctx }) => {
    const challenge = await weeklyChallengeService.getOrCreateCurrent()
    const tasks = await weeklyChallengeService.listTasksFor(challenge)
    let attempts: Awaited<ReturnType<typeof db.weeklyChallengeAttempt.findMany>> = []
    if (ctx.user) {
      attempts = await db.weeklyChallengeAttempt.findMany({
        where: { userId: ctx.user.id, isoWeek: challenge.isoWeek }
      })
    }
    return {
      isoWeek: challenge.isoWeek,
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        estimatedMinutes: task.estimatedMinutes,
        initialData: (task.initialData ?? {}) as Record<string, unknown>
      })),
      attempts: attempts.map(attempt => ({
        taskIndex: attempt.taskIndex,
        status: attempt.status,
        solvedAt: attempt.solvedAt
      }))
    }
  }),

  submit: heavyProcedure.input(submitInputSchema).mutation(async ({ ctx, input }) => {
    const challenge = await weeklyChallengeService.getOrCreateCurrent()
    const task = await weeklyChallengeService.findTaskAtIndex(challenge.isoWeek, input.taskIndex)
    if (!task) throw new TRPCError({ code: 'NOT_FOUND', message: 'Задание не найдено.' })
    const result = await ctx.repositories.execution.enqueue(ctx.user.id, {
      taskId: task.id,
      language: input.language,
      code: input.code,
      mode: 'submit',
      contextKind: 'weekly',
      contextRef: `${challenge.isoWeek}#${input.taskIndex}`
    })
    await weeklyChallengeService.recordExecutionStart({
      userId: ctx.user.id,
      isoWeek: challenge.isoWeek,
      taskIndex: input.taskIndex,
      executionId: result.executionId
    })
    return result
  })
})

void computeIsoWeek
