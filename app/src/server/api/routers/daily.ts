import 'server-only'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { heavyProcedure } from '~/server/api/procedures'
import { db } from '~/server/db'
import { dailyChallengeService } from '~/server/services/DailyChallengeService'

const submitInputSchema = z.object({
  taskIndex: z.number().int().min(0).max(2),
  language: z.enum(['python', 'php']),
  code: z.string().max(50_000)
})

/**
 * Public read of today's challenge + protected submit. The submit path
 * delegates to `execution.run` semantics (mode=submit, contextKind=daily),
 * letting the result consumer mark the attempt SUCCESS and award XP/streak.
 */
export const dailyRouter = createTRPCRouter({
  getToday: publicProcedure.query(async ({ ctx }) => {
    const challenge = await dailyChallengeService.getOrCreateToday()
    const tasks = await dailyChallengeService.listTasksFor(challenge)
    let attempts: Awaited<ReturnType<typeof db.dailyChallengeAttempt.findMany>> = []
    if (ctx.user) {
      attempts = await db.dailyChallengeAttempt.findMany({
        where: { userId: ctx.user.id, date: challenge.date }
      })
    }
    return {
      date: challenge.date,
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
    const challenge = await dailyChallengeService.getOrCreateToday()
    const task = await dailyChallengeService.findTaskAtIndex(challenge.date, input.taskIndex)
    if (!task) throw new TRPCError({ code: 'NOT_FOUND', message: 'Задание не найдено.' })
    const result = await ctx.repositories.execution.enqueue(ctx.user.id, {
      taskId: task.id,
      language: input.language,
      code: input.code,
      mode: 'submit',
      contextKind: 'daily',
      contextRef: `${challenge.date}#${input.taskIndex}`
    })
    await dailyChallengeService.recordExecutionStart({
      userId: ctx.user.id,
      date: challenge.date,
      taskIndex: input.taskIndex,
      executionId: result.executionId
    })
    return result
  }),

  myStreak: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.user.id },
      select: { streakDays: true, lastActiveDay: true }
    })
    return {
      streakDays: user?.streakDays ?? 0,
      lastActiveDay: user?.lastActiveDay ?? null
    }
  })
})
