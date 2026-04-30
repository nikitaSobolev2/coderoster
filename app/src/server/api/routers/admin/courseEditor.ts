import { z } from 'zod'
import { adminProcedure } from '~/server/api/procedures'
import { createTRPCRouter } from '~/server/api/trpc'

const taskKindEnum = z.enum(['THEORY', 'TASK', 'QUIZ'])

const courseUpdatePatch = z
  .object({
    slug: z
      .string()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9-]+$/),
    title: z.string().min(1).max(160),
    summary: z.string().max(800),
    shortSummary: z.string().max(280),
    description: z.string().max(50_000),
    language: z.string().min(1).max(40),
    difficulty: z.string().min(1).max(40),
    durationHours: z.number().int().min(0).max(2_000),
    xpReward: z.number().int().min(0).max(1_000_000),
    coverImage: z.string().url().nullable(),
    categoryId: z.string().nullable(),
    tags: z.array(z.string().min(1).max(40)).max(20),
    tierRequired: z.number().int().min(0).max(999)
  })
  .partial()

const taskUpsertPatch = z
  .object({
    title: z.string().min(1).max(200),
    summary: z.string().max(500),
    description: z.string().max(50_000),
    kind: taskKindEnum,
    estimatedMinutes: z.number().int().min(0).max(600),
    allowedLanguages: z.array(z.string().min(1).max(40)).max(20),
    initialData: z.record(z.unknown()),
    result: z.record(z.unknown()).nullable(),
    isPremium: z.boolean(),
    minPlanTier: z.number().int().min(0).max(999)
  })
  .partial()

const autotestPatch = z
  .object({
    name: z.string().min(1).max(160),
    input: z.string().max(50_000).nullable(),
    expected: z.string().max(50_000),
    hidden: z.boolean()
  })
  .partial()

export const adminCourseEditorRouter = createTRPCRouter({
  get: adminProcedure
    .input(z.object({ courseId: z.string().min(1) }))
    .query(({ ctx, input }) => ctx.repositories.admin.courseEditor.getTree(input.courseId)),

  updateCourse: adminProcedure
    .input(z.object({ courseId: z.string().min(1), patch: courseUpdatePatch }))
    .mutation(async ({ ctx, input }) => {
      await ctx.repositories.admin.courseEditor.updateCourse(input.courseId, input.patch)
      return { ok: true as const }
    }),

  module: createTRPCRouter({
    create: adminProcedure
      .input(
        z.object({
          courseId: z.string().min(1),
          title: z.string().min(1).max(200),
          description: z.string().max(800).optional()
        })
      )
      .mutation(({ ctx, input }) =>
        ctx.repositories.admin.courseEditor.createModule(input.courseId, {
          title: input.title,
          description: input.description
        })
      ),

    update: adminProcedure
      .input(
        z.object({
          moduleId: z.string().min(1),
          patch: z.object({
            title: z.string().min(1).max(200).optional(),
            description: z.string().max(800).optional()
          })
        })
      )
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.courseEditor.updateModule(input.moduleId, input.patch)
        return { ok: true as const }
      }),

    delete: adminProcedure
      .input(z.object({ moduleId: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.courseEditor.deleteModule(input.moduleId)
        return { ok: true as const }
      }),

    reorder: adminProcedure
      .input(
        z.object({
          courseId: z.string().min(1),
          orderedIds: z.array(z.string().min(1)).max(200)
        })
      )
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.courseEditor.reorderModules(input.courseId, input.orderedIds)
        return { ok: true as const }
      })
  }),

  task: createTRPCRouter({
    create: adminProcedure
      .input(
        z.object({
          moduleId: z.string().min(1),
          title: z.string().min(1).max(200),
          kind: taskKindEnum.optional()
        })
      )
      .mutation(({ ctx, input }) =>
        ctx.repositories.admin.courseEditor.createTask(input.moduleId, {
          title: input.title,
          kind: input.kind
        })
      ),

    update: adminProcedure
      .input(z.object({ taskId: z.string().min(1), patch: taskUpsertPatch }))
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.courseEditor.updateTask(input.taskId, input.patch)
        return { ok: true as const }
      }),

    delete: adminProcedure
      .input(z.object({ taskId: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.courseEditor.deleteTask(input.taskId)
        return { ok: true as const }
      }),

    reorder: adminProcedure
      .input(
        z.object({
          moduleId: z.string().min(1),
          orderedIds: z.array(z.string().min(1)).max(500)
        })
      )
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.courseEditor.reorderTasks(input.moduleId, input.orderedIds)
        return { ok: true as const }
      })
  }),

  autotest: createTRPCRouter({
    create: adminProcedure
      .input(
        z.object({
          taskId: z.string().min(1),
          name: z.string().min(1).max(160),
          input: z.string().max(50_000).nullable().optional(),
          expected: z.string().max(50_000),
          hidden: z.boolean().optional()
        })
      )
      .mutation(({ ctx, input }) =>
        ctx.repositories.admin.courseEditor.createAutotest(input.taskId, {
          name: input.name,
          input: input.input ?? null,
          expected: input.expected,
          hidden: input.hidden
        })
      ),

    update: adminProcedure
      .input(z.object({ autotestId: z.string().min(1), patch: autotestPatch }))
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.courseEditor.updateAutotest(input.autotestId, input.patch)
        return { ok: true as const }
      }),

    delete: adminProcedure
      .input(z.object({ autotestId: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.courseEditor.deleteAutotest(input.autotestId)
        return { ok: true as const }
      }),

    reorder: adminProcedure
      .input(
        z.object({
          taskId: z.string().min(1),
          orderedIds: z.array(z.string().min(1)).max(500)
        })
      )
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.courseEditor.reorderAutotests(input.taskId, input.orderedIds)
        return { ok: true as const }
      })
  })
})
