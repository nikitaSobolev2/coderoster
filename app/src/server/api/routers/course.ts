import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'
import { planService } from '~/server/services/PlanService'

const languageSchema = z.enum(['python', 'php'])
const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced'])
const sortSchema = z.enum(['popular', 'newest', 'shortest'])
const categorySlugItem = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9-]+$/)

export const courseRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          q: z.string().trim().max(120).optional(),
          languages: z.array(languageSchema).max(8).optional(),
          difficulties: z.array(difficultySchema).max(8).optional(),
          categorySlugs: z.array(categorySlugItem).max(16).optional(),
          durationMin: z.number().int().min(0).max(2_000).optional(),
          durationMax: z.number().int().min(0).max(2_000).optional(),
          sort: sortSchema.optional(),
          cursor: z.string().optional(),
          limit: z.number().int().min(1).max(60).optional(),
          freeOnly: z.boolean().optional(),
          matchesMyPlan: z.boolean().optional()
        })
        .default({})
    )
    .query(async ({ ctx, input }) => {
      const viewerTier = ctx.user ? await planService.getEffectiveTier(ctx.user.id) : 0
      return ctx.repositories.course.list(input, { viewerTier })
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(120) }))
    .query(({ ctx, input }) => ctx.repositories.course.getBySlug(input.slug)),

  listCategories: publicProcedure.query(({ ctx }) => ctx.repositories.course.listCategories())
})
