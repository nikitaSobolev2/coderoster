import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { idempotentProcedure } from '~/server/api/procedures'
import { invalidateProfileCachesForUserId } from '~/server/cache/invalidateProfileCaches'

const slugInput = z.object({ courseSlug: z.string().min(1).max(120) })

export const enrollmentRouter = createTRPCRouter({
  getMine: publicProcedure.input(slugInput).query(({ ctx, input }) => {
    if (!ctx.user) return null
    return ctx.repositories.enrollment.getMine(ctx.user.id, input.courseSlug)
  }),

  start: idempotentProcedure
    .input(slugInput)
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.repositories.enrollment.start(ctx.user.id, input.courseSlug)
      await invalidateProfileCachesForUserId(ctx.user.id)
      return row
    }),

  abandon: idempotentProcedure
    .input(slugInput)
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.repositories.enrollment.abandon(ctx.user.id, input.courseSlug)
      await invalidateProfileCachesForUserId(ctx.user.id)
      return row
    }),

  myShowcase: protectedProcedure.query(({ ctx }) =>
    ctx.repositories.enrollment.listShowcase(ctx.user.id)
  )
})
