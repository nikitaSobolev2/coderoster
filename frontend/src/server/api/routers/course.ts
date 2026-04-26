import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'

const languageSchema = z.enum(['python', 'php'])
const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced'])
const sortSchema = z.enum(['popular', 'newest', 'shortest'])

export const courseRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          q: z.string().trim().max(120).optional(),
          language: languageSchema.optional(),
          difficulty: difficultySchema.optional(),
          sort: sortSchema.optional(),
          cursor: z.string().optional(),
          limit: z.number().int().min(1).max(60).optional()
        })
        .default({})
    )
    .query(({ ctx, input }) => ctx.repositories.course.list(input)),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(120) }))
    .query(({ ctx, input }) => ctx.repositories.course.getBySlug(input.slug))
})
