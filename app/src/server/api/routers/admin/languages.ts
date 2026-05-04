import { z } from 'zod'
import { adminProcedure, authorStaffProcedure } from '~/server/api/procedures'
import { createTRPCRouter } from '~/server/api/trpc'

export const adminLanguagesRouter = createTRPCRouter({
  list: authorStaffProcedure.query(({ ctx }) => ctx.repositories.admin.languages.list()),

  update: adminProcedure
    .input(
      z.object({
        languages: z.array(z.string().min(1).max(40)).max(40)
      })
    )
    .mutation(({ ctx, input }) => ctx.repositories.admin.languages.update(input.languages))
})
