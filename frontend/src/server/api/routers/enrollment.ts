import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '~/server/api/trpc'

const slugInput = z.object({ courseSlug: z.string().min(1).max(120) })

export const enrollmentRouter = createTRPCRouter({
  getMine: publicProcedure.input(slugInput).query(({ ctx, input }) => {
    if (!ctx.user) return null
    return ctx.repositories.enrollment.getMine(ctx.user.id, input.courseSlug)
  }),

  start: protectedProcedure
    .input(slugInput)
    .mutation(({ ctx, input }) => ctx.repositories.enrollment.start(ctx.user.id, input.courseSlug)),

  abandon: protectedProcedure
    .input(slugInput)
    .mutation(({ ctx, input }) =>
      ctx.repositories.enrollment.abandon(ctx.user.id, input.courseSlug)
    ),

  myShowcase: protectedProcedure.query(({ ctx }) =>
    ctx.repositories.enrollment.listShowcase(ctx.user.id)
  )
})
