import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'

export const searchRouter = createTRPCRouter({
  global: publicProcedure
    .input(z.object({ q: z.string().trim().max(120) }))
    .query(({ ctx, input }) => ctx.repositories.search.global(input.q))
})
