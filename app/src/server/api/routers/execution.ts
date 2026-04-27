import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { heavyProcedure } from '~/server/api/procedures'

export const executionRouter = createTRPCRouter({
  /**
   * Enqueues a code execution. Writes the `Execution` row + the matching
   * `OutboxEvent` in a single transaction; the worker runs the actual code
   * asynchronously. Clients poll `execution.get` until the status is terminal.
   */
  run: heavyProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
        language: z.enum(['python', 'php']),
        code: z.string().max(50_000)
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.repositories.execution.enqueue(ctx.user.id, {
        taskId: input.taskId,
        language: input.language,
        code: input.code
      })
    ),

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
