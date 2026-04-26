import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const progressRouter = createTRPCRouter({
  saveDraft: protectedProcedure
    .input(
      z.object({
        lessonId: z.string().min(1),
        code: z.string().max(100_000)
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.repositories.progress.saveDraft(ctx.user.id, input.lessonId, input.code)
      return { ok: true as const }
    }),

  getDraft: protectedProcedure
    .input(z.object({ lessonId: z.string().min(1) }))
    .query(({ ctx, input }) => ctx.repositories.progress.getDraft(ctx.user.id, input.lessonId)),

  markComplete: protectedProcedure
    .input(z.object({ lessonId: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.repositories.progress.markComplete(ctx.user.id, input.lessonId)
    )
})
