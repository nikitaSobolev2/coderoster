import { z } from 'zod'

import { adminProcedure } from '~/server/api/procedures'
import { createTRPCRouter } from '~/server/api/trpc'

export const adminContactMessagesRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z
        .object({
          cursor: z.string().optional(),
          limit: z.number().int().min(1).max(100).optional()
        })
        .optional()
    )
    .query(({ ctx, input }) => ctx.repositories.admin.contactMessages.list(input ?? {}))
})
