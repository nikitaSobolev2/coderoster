import { z } from 'zod'
import { adminProcedure } from '~/server/api/procedures'
import { createTRPCRouter } from '~/server/api/trpc'

export const adminAiCodeImproveRouter = createTRPCRouter({
  get: adminProcedure.query(({ ctx }) => ctx.repositories.admin.aiCodeImprove.get()),

  update: adminProcedure
    .input(
      z.object({
        model: z.string().min(1).max(128)
      })
    )
    .mutation(({ ctx, input }) => ctx.repositories.admin.aiCodeImprove.update(input))
})
