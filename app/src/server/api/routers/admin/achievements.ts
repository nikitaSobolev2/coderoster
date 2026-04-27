import { z } from 'zod'
import { adminProcedure } from '~/server/api/procedures'
import { createTRPCRouter } from '~/server/api/trpc'

const upsert = {
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(800),
  category: z.string().min(1).max(40),
  rarity: z.string().min(1).max(40),
  hidden: z.boolean().optional(),
  goal: z.number().int().min(0).max(1_000_000).nullable().optional(),
  coverImage: z.string().max(160).nullable().optional(),
  imageUrl: z.string().url().max(2048).nullable().optional(),
  awardId: z.string().max(160).nullable().optional()
}

export const adminAchievementsRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) => ctx.repositories.admin.achievements.list()),

  get: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ ctx, input }) => ctx.repositories.admin.achievements.get(input.id)),

  create: adminProcedure
    .input(z.object(upsert))
    .mutation(({ ctx, input }) => ctx.repositories.admin.achievements.create(input)),

  update: adminProcedure
    .input(z.object({ id: z.string().min(1), patch: z.object(upsert).partial() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.repositories.admin.achievements.update(input.id, input.patch)
      return { ok: true as const }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.repositories.admin.achievements.delete(input.id)
      return { ok: true as const }
    })
})
