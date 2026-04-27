import { z } from 'zod'
import { adminProcedure } from '~/server/api/procedures'
import { createTRPCRouter } from '~/server/api/trpc'

const placement = z.enum(['FOOTER', 'HEADER', 'HIDDEN'])

const upsert = {
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  body: z.string().max(50_000),
  excerpt: z.string().max(500).optional(),
  placement: placement.optional(),
  groupKey: z.string().max(60).optional(),
  order: z.number().int().min(0).max(10_000).optional(),
  published: z.boolean().optional()
}

export const adminContentPagesRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) => ctx.repositories.admin.contentPages.list()),

  get: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ ctx, input }) => ctx.repositories.admin.contentPages.get(input.id)),

  create: adminProcedure
    .input(z.object(upsert))
    .mutation(({ ctx, input }) => ctx.repositories.admin.contentPages.create(input)),

  update: adminProcedure
    .input(z.object({ id: z.string().min(1), patch: z.object(upsert).partial() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.repositories.admin.contentPages.update(input.id, input.patch)
      return { ok: true as const }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.repositories.admin.contentPages.delete(input.id)
      return { ok: true as const }
    }),

  setPublished: adminProcedure
    .input(z.object({ id: z.string().min(1), published: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.repositories.admin.contentPages.update(input.id, { published: input.published })
      return { ok: true as const }
    }),

  reorder: adminProcedure
    .input(z.object({ orderedIds: z.array(z.string().min(1)).max(500) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.repositories.admin.contentPages.reorder(input.orderedIds)
      return { ok: true as const }
    })
})
