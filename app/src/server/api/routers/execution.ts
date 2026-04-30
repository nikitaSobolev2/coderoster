import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { heavyProcedure } from '~/server/api/procedures'

const runInputSchema = z.object({
  taskId: z.string().min(1).nullable().optional(),
  language: z.enum(['python', 'php']),
  code: z.string().max(50_000),
  mode: z.enum(['run', 'submit']).default('run'),
  context: z
    .object({
      kind: z.enum(['course', 'sandbox', 'daily', 'weekly']).default('course'),
      ref: z.string().nullable().optional()
    })
    .default({ kind: 'course', ref: null })
})

export const executionRouter = createTRPCRouter({
  /**
   * Enqueues a code execution. Mode-aware:
   * - `run` is a non-graded preview (no tryN bump, no progress).
   * - `submit` ships the task autotests to the worker; the result consumer
   *   advances the attempt and progress only when all tests pass.
   */
  run: heavyProcedure.input(runInputSchema).mutation(async ({ ctx, input }) => {
    try {
      return await ctx.repositories.execution.enqueue(ctx.user.id, {
        taskId: input.taskId ?? null,
        language: input.language,
        code: input.code,
        mode: input.mode,
        contextKind: input.context.kind,
        contextRef: input.context.ref ?? null
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'TASK_PLAN_BLOCKED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'Это задание только на Премиуме. Открой страницу «Тарифы» и выбери подходящий план.'
        })
      }
      throw error
    }
  }),

  get: protectedProcedure
    .input(z.object({ executionId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.repositories.execution.getById(input.executionId, ctx.user.id)
      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Запуск не найден.' })
      }
      return record
    })
})
