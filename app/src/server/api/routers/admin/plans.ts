import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { Prisma } from '@prisma/client'
import { adminProcedure } from '~/server/api/procedures'
import { createTRPCRouter } from '~/server/api/trpc'
import { planMarketingBulletsSchema } from '~/shared/plan/planMarketing'

const slugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9-]+$/)

const planMarketingFields = {
  marketingMarkdown: z.string().max(50_000).optional(),
  marketingFeatures: planMarketingBulletsSchema.optional(),
  isBestseller: z.boolean().optional()
}

const planCreate = z
  .object({
    slug: slugSchema,
    name: z.string().min(1).max(120),
    shortDescription: z.string().max(500).optional(),
    tierLevel: z.number().int().min(0).max(999),
    xpBonusPercent: z.number().int().min(0).max(500).optional(),
    sortOrder: z.number().int().min(0).optional(),
    maxActiveCourses: z.number().int().min(1).max(500).nullable().optional(),
    isDefaultFree: z.boolean().optional()
  })
  .extend(planMarketingFields)

const planPatch = planCreate.partial().extend({
  slug: slugSchema.optional(),
  tierLevel: z.number().int().min(0).max(999).optional()
})

function mapPrismaPlanError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Уникальность: slug или tierLevel уже заняты.'
      })
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Не удалось сохранить план.'
    })
  }
  if (error instanceof TRPCError) throw error
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Не удалось сохранить план.'
  })
}

export const adminPlansRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) => ctx.repositories.admin.plans.list()),

  create: adminProcedure.input(planCreate).mutation(async ({ ctx, input }) => {
    try {
      return await ctx.repositories.admin.plans.create(input)
    } catch (e) {
      mapPrismaPlanError(e)
    }
  }),

  update: adminProcedure
    .input(z.object({ id: z.string().min(1), patch: planPatch }))
    .mutation(async ({ ctx, input }) => {
      if (Object.keys(input.patch).length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Пустой патч.' })
      }
      try {
        return await ctx.repositories.admin.plans.update(input.id, input.patch)
      } catch (e) {
        mapPrismaPlanError(e)
      }
    }),

  setDefaultFree: adminProcedure
    .input(z.object({ planId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => ctx.repositories.admin.plans.setDefaultFree(input.planId)),

  setBestseller: adminProcedure
    .input(z.object({ planId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => ctx.repositories.admin.plans.setBestseller(input.planId)),

  clearBestseller: adminProcedure
    .input(z.object({ planId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) =>
      ctx.repositories.admin.plans.update(input.planId, { isBestseller: false })
    )
})
