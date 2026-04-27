import { z } from 'zod'
import { adminProcedure } from '~/server/api/procedures'
import { createTRPCRouter } from '~/server/api/trpc'

export const adminLeaderboardRouter = createTRPCRouter({
  list: adminProcedure
    .input(z.object({ language: z.string().max(40).optional() }).optional())
    .query(({ ctx, input }) => ctx.repositories.admin.leaderboard.list(input?.language ?? null)),

  setExclusion: adminProcedure
    .input(z.object({ userId: z.string().min(1), excluded: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.repositories.admin.leaderboard.setExclusion(input.userId, input.excluded)
      return { ok: true as const }
    })
})

export const adminCommentsRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z
        .object({
          q: z.string().max(200).optional(),
          cursor: z.string().optional(),
          limit: z.number().int().min(1).max(100).optional()
        })
        .optional()
    )
    .query(({ ctx, input }) => ctx.repositories.admin.comments.list(input ?? {})),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.repositories.admin.comments.delete(input.id)
      return { ok: true as const }
    })
})
