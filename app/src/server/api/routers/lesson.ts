import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'

export const lessonRouter = createTRPCRouter({
  getOne: publicProcedure
    .input(
      z.object({
        courseSlug: z.string().min(1),
        lessonId: z.string().min(1)
      })
    )
    .query(({ ctx, input }) =>
      ctx.repositories.lesson.getOne(input.courseSlug, input.lessonId, ctx.user?.id ?? null)
    )
})
