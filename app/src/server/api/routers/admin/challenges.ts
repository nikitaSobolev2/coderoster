import { z } from 'zod'
import { adminProcedure } from '~/server/api/procedures'
import { createTRPCRouter } from '~/server/api/trpc'

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const isoWeekString = z.string().regex(/^\d{4}-W\d{2}$/)
const taskKindEnum = z.enum(['THEORY', 'TASK', 'QUIZ'])

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

/**
 * Daily / weekly challenges with their own task editor (mirrors the course
 * editor surface): challenge → ordered tasks → per-task autotests. Authoring
 * tasks under a challenge is done in-place, never by linking to a course
 * task.
 */
export const adminChallengesRouter = createTRPCRouter({
  daily: createTRPCRouter({
    list: adminProcedure.query(({ ctx }) => ctx.repositories.admin.challenges.listDaily()),

    get: adminProcedure
      .input(z.object({ id: z.string().min(1) }))
      .query(({ ctx, input }) => ctx.repositories.admin.challenges.getDaily(input.id)),

    create: adminProcedure
      .input(z.object({ date: dateString }))
      .mutation(({ ctx, input }) => ctx.repositories.admin.challenges.createDaily(input.date)),

    delete: adminProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.challenges.deleteDaily(input.id)
        return { ok: true as const }
      }),

    task: createTRPCRouter({
      create: adminProcedure
        .input(
          z.object({
            dailyChallengeId: z.string().min(1),
            title: z.string().min(1).max(200),
            kind: taskKindEnum.optional()
          })
        )
        .mutation(({ ctx, input }) =>
          ctx.repositories.admin.challenges.createDailyTask(input.dailyChallengeId, {
            title: input.title,
            kind: input.kind
          })
        ),

      update: adminProcedure
        .input(z.object({ taskId: z.string().min(1), patch: taskUpsertPatch }))
        .mutation(async ({ ctx, input }) => {
          await ctx.repositories.admin.challenges.updateChallengeTask(input.taskId, input.patch)
          return { ok: true as const }
        }),

      delete: adminProcedure
        .input(z.object({ taskId: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
          await ctx.repositories.admin.challenges.deleteChallengeTask(input.taskId)
          return { ok: true as const }
        }),

      reorder: adminProcedure
        .input(
          z.object({
            dailyChallengeId: z.string().min(1),
            orderedIds: z.array(z.string().min(1)).max(500)
          })
        )
        .mutation(async ({ ctx, input }) => {
          await ctx.repositories.admin.challenges.reorderDailyTasks(
            input.dailyChallengeId,
            input.orderedIds
          )
          return { ok: true as const }
        })
    })
  }),

  weekly: createTRPCRouter({
    list: adminProcedure.query(({ ctx }) => ctx.repositories.admin.challenges.listWeekly()),

    get: adminProcedure
      .input(z.object({ id: z.string().min(1) }))
      .query(({ ctx, input }) => ctx.repositories.admin.challenges.getWeekly(input.id)),

    create: adminProcedure
      .input(z.object({ isoWeek: isoWeekString }))
      .mutation(({ ctx, input }) => ctx.repositories.admin.challenges.createWeekly(input.isoWeek)),

    delete: adminProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.challenges.deleteWeekly(input.id)
        return { ok: true as const }
      }),

    task: createTRPCRouter({
      create: adminProcedure
        .input(
          z.object({
            weeklyChallengeId: z.string().min(1),
            title: z.string().min(1).max(200),
            kind: taskKindEnum.optional()
          })
        )
        .mutation(({ ctx, input }) =>
          ctx.repositories.admin.challenges.createWeeklyTask(input.weeklyChallengeId, {
            title: input.title,
            kind: input.kind
          })
        ),

      update: adminProcedure
        .input(z.object({ taskId: z.string().min(1), patch: taskUpsertPatch }))
        .mutation(async ({ ctx, input }) => {
          await ctx.repositories.admin.challenges.updateChallengeTask(input.taskId, input.patch)
          return { ok: true as const }
        }),

      delete: adminProcedure
        .input(z.object({ taskId: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
          await ctx.repositories.admin.challenges.deleteChallengeTask(input.taskId)
          return { ok: true as const }
        }),

      reorder: adminProcedure
        .input(
          z.object({
            weeklyChallengeId: z.string().min(1),
            orderedIds: z.array(z.string().min(1)).max(500)
          })
        )
        .mutation(async ({ ctx, input }) => {
          await ctx.repositories.admin.challenges.reorderWeeklyTasks(
            input.weeklyChallengeId,
            input.orderedIds
          )
          return { ok: true as const }
        })
    })
  }),

  /**
   * Autotests are owner-agnostic — challenge tasks and course tasks share
   * the same `CourseTaskAutotest` table, so a single sub-router serves both.
   */
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
        ctx.repositories.admin.challenges.createAutotest(input.taskId, {
          name: input.name,
          input: input.input ?? null,
          expected: input.expected,
          hidden: input.hidden
        })
      ),

    update: adminProcedure
      .input(z.object({ autotestId: z.string().min(1), patch: autotestPatch }))
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.challenges.updateAutotest(input.autotestId, input.patch)
        return { ok: true as const }
      }),

    delete: adminProcedure
      .input(z.object({ autotestId: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await ctx.repositories.admin.challenges.deleteAutotest(input.autotestId)
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
        await ctx.repositories.admin.challenges.reorderAutotests(input.taskId, input.orderedIds)
        return { ok: true as const }
      })
  })
})
