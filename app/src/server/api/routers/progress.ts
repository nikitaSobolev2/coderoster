import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const progressRouter = createTRPCRouter({
  getTaskAttemptStatus: protectedProcedure
    .input(z.object({ lessonId: z.string().min(1) }))
    .query(({ ctx, input }) =>
      ctx.repositories.progress.getTaskAttemptStatus(ctx.user.id, input.lessonId)
    ),

  saveDraft: protectedProcedure
    .input(
      z.object({
        lessonId: z.string().min(1),
        language: z.enum(['python', 'php']),
        code: z.string().max(100_000)
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.repositories.progress.saveDraft(
        ctx.user.id,
        input.lessonId,
        input.language,
        input.code
      )
      return { ok: true as const }
    }),

  getDrafts: protectedProcedure
    .input(
      z.object({
        lessonId: z.string().min(1),
        languages: z.array(z.enum(['python', 'php'])).min(1)
      })
    )
    .query(({ ctx, input }) =>
      ctx.repositories.progress.getDrafts(ctx.user.id, input.lessonId, input.languages)
    ),

  markComplete: protectedProcedure
    .input(z.object({ lessonId: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.repositories.progress.markComplete(ctx.user.id, input.lessonId)
    )
})
