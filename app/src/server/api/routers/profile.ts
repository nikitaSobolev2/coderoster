import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'

const usernameInput = z.object({ username: z.string().min(1).max(64) })

export const profileRouter = createTRPCRouter({
  getByUsername: publicProcedure
    .input(usernameInput)
    .query(({ ctx, input }) =>
      ctx.repositories.profile.getByUsername(input.username, ctx.user?.id ?? null)
    ),

  getActivity: publicProcedure
    .input(usernameInput.extend({ year: z.number().int().min(2020).max(2100) }))
    .query(({ ctx, input }) => ctx.repositories.profile.getActivity(input.username, input.year)),

  getAchievements: publicProcedure
    .input(usernameInput)
    .query(({ ctx, input }) => ctx.repositories.profile.getAchievements(input.username))
})
