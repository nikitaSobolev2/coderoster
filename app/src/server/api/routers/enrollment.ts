import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { idempotentProcedure } from '~/server/api/procedures'
import { invalidateProfileCachesForUserId } from '~/server/cache/invalidateProfileCaches'

const slugInput = z.object({ courseSlug: z.string().min(1).max(120) })

function mapEnrollmentStartError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === 'PLAN_TIER_TOO_LOW') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message:
          'Этот курс только по Премиуму — твоего плана недостаточно. Открой страницу тарифов и выбери подходящий.'
      })
    }
    if (error.message === 'ACTIVE_ENROLLMENT_CAP') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message:
          'На бесплатном плане одновременно доступно не более трёх активных курсов. Заверши или откажись от курса либо оформи Pro.'
      })
    }
    if (error.message === 'COURSE_NOT_FOUND') {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Курс не найден.' })
    }
  }
  throw error
}

export const enrollmentRouter = createTRPCRouter({
  getMine: publicProcedure.input(slugInput).query(({ ctx, input }) => {
    if (!ctx.user) return null
    return ctx.repositories.enrollment.getMine(ctx.user.id, input.courseSlug)
  }),

  start: idempotentProcedure.input(slugInput).mutation(async ({ ctx, input }) => {
    try {
      const row = await ctx.repositories.enrollment.start(ctx.user.id, input.courseSlug)
      await invalidateProfileCachesForUserId(ctx.user.id)
      return row
    } catch (error) {
      mapEnrollmentStartError(error)
    }
  }),

  abandon: idempotentProcedure.input(slugInput).mutation(async ({ ctx, input }) => {
    const row = await ctx.repositories.enrollment.abandon(ctx.user.id, input.courseSlug)
    await invalidateProfileCachesForUserId(ctx.user.id)
    return row
  }),

  myShowcase: protectedProcedure.query(({ ctx }) =>
    ctx.repositories.enrollment.listShowcase(ctx.user.id)
  )
})
