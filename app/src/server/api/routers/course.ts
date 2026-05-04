import { Role } from '@prisma/client'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { db } from '~/server/db'
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

  /** Whether the signed-in user may open the back-office editor for this course. */
  canManageBySlug: protectedProcedure
    .input(z.object({ slug: z.string().min(1).max(120) }))
    .query(async ({ ctx, input }) => {
      const course = await db.course.findUnique({
        where: { slug: input.slug },
        select: { id: true, authorId: true }
      })
      if (!course) {
        return { canEdit: false, courseId: null as string | null }
      }
      const fresh = await db.user.findUnique({
        where: { id: ctx.user.id },
        select: { role: true, bannedUntil: true }
      })
      if (!fresh) {
        return { canEdit: false, courseId: course.id }
      }
      if (fresh.bannedUntil && fresh.bannedUntil > new Date()) {
        return { canEdit: false, courseId: course.id }
      }
      if (fresh.role === Role.ADMIN) {
        return { canEdit: true, courseId: course.id }
      }
      if (fresh.role === Role.AUTHOR && course.authorId === ctx.user.id) {
        return { canEdit: true, courseId: course.id }
      }
      return { canEdit: false, courseId: course.id }
    }),

  listCategories: publicProcedure.query(({ ctx }) => ctx.repositories.course.listCategories())
})
