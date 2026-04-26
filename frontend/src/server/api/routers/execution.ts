import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const executionRouter = createTRPCRouter({
  run: protectedProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
        language: z.enum(['python', 'php']),
        code: z.string().max(50_000)
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.repositories.execution.run({
        taskId: input.taskId,
        language: input.language,
        code: input.code
      })
    )
})
