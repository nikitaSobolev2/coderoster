import { z } from 'zod'
import { adminProcedure, authorStaffProcedure } from '~/server/api/procedures'
import { createTRPCRouter } from '~/server/api/trpc'
import { assertCourseWritable } from '~/server/auth/courseWriteAccess'

const slug = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9-]+$/)

const categoryUpsert = {
  slug,
  title: z.string().min(1).max(120),
  summary: z.string().max(500).optional(),
  iconKey: z.string().max(60).nullable().optional(),
  imageUrl: z.string().url().max(2048).nullable().optional(),
  parentCategoryId: z.string().nullable().optional(),
  order: z.number().int().min(0).max(10_000).optional()
}

const courseListInput = z
  .object({
    q: z.string().max(120).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional(),
    categoryId: z.string().optional(),
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(60).optional(),
    /** Optional scope; authors always get theirs forced server-side. */
    authorId: z.string().optional()
  })
  .optional()

export const adminCatalogRouter = createTRPCRouter({
  categories: createTRPCRouter({
    list: authorStaffProcedure.query(({ ctx }) => ctx.repositories.admin.catalog.listCategories()),

    create: adminProcedure
      .input(z.object(categoryUpsert))
      .mutation(({ ctx, input }) =>
        ctx.repositories.admin.catalog.createCategory(ctx.user.id, input)
      ),

    update: adminProcedure
      .input(z.object({ id: z.string().min(1), patch: z.object(categoryUpsert).partial() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.catalog.updateCategory(input.id, input.patch)
        return { ok: true as const }
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.catalog.deleteCategory(input.id)
        return { ok: true as const }
      }),

    reorder: adminProcedure
      .input(z.object({ orderedIds: z.array(z.string().min(1)).max(500) }))
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.catalog.reorderCategories(input.orderedIds)
        return { ok: true as const }
      })
  }),

  courses: createTRPCRouter({
    list: authorStaffProcedure.input(courseListInput).query(({ ctx, input }) => {
      const params = { ...(input ?? {}) }
      if (ctx.user.role === 'author') {
        params.authorId = ctx.user.id
      }
      return ctx.repositories.admin.catalog.listCourses(params)
    }),

    create: authorStaffProcedure
      .input(z.object({ slug, title: z.string().min(1).max(160) }))
      .mutation(({ ctx, input }) =>
        ctx.repositories.admin.catalog.createCourse({
          slug: input.slug,
          title: input.title,
          authorId: ctx.user.id
        })
      ),

    delete: authorStaffProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await assertCourseWritable(ctx.user, input.id)
        await ctx.repositories.admin.catalog.deleteCourse(input.id)
        return { ok: true as const }
      }),

    setStatus: authorStaffProcedure
      .input(
        z.object({
          id: z.string().min(1),
          status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN'])
        })
      )
      .mutation(async ({ ctx, input }) => {
        await assertCourseWritable(ctx.user, input.id)
        await ctx.repositories.admin.catalog.setStatus(input.id, input.status)
        return { ok: true as const }
      }),

    reorder: adminProcedure
      .input(z.object({ orderedIds: z.array(z.string().min(1)).max(500) }))
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.catalog.reorderCourses(input.orderedIds)
        return { ok: true as const }
      })
  })
})
