import { z } from 'zod'
import { adminProcedure } from '~/server/api/procedures'
import { createTRPCRouter } from '~/server/api/trpc'

export const adminAuditRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z
        .object({
          actorId: z.string().optional(),
          targetType: z.string().max(60).optional(),
          targetId: z.string().max(120).optional(),
          cursor: z.string().optional(),
          limit: z.number().int().min(1).max(200).optional()
        })
        .optional()
    )
    .query(({ ctx, input }) => ctx.repositories.admin.audit.list(input ?? {}))
})
