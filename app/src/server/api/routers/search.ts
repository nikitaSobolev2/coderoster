import { z } from 'zod'
import { createTRPCRouter } from '~/server/api/trpc'
import { searchProcedure } from '~/server/api/procedures'

export const searchRouter = createTRPCRouter({
  global: searchProcedure
    .input(z.object({ q: z.string().trim().max(120) }))
    .query(({ ctx, input }) =>
      ctx.repositories.search.global(input.q, { includeAuthRoutes: ctx.user != null })
    )
})
