import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { adminProcedure } from '~/server/api/procedures'
import { createTRPCRouter } from '~/server/api/trpc'
import { db } from '~/server/db'
import { invalidateProfileCachesForUserId } from '~/server/cache/invalidateProfileCaches'

const userIdInput = z.object({ id: z.string().min(1) })

const listInput = z
  .object({
    q: z.string().max(120).optional(),
    role: z.enum(['LEARNER', 'AUTHOR', 'MODERATOR', 'ADMIN']).optional(),
    banned: z.enum(['all', 'banned', 'active']).optional(),
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional()
  })
  .optional()

const updateInput = z.object({
  id: z.string().min(1),
  patch: z
    .object({
      displayName: z.string().min(1).max(120).optional(),
      username: z
        .string()
        .min(2)
        .max(32)
        .regex(/^[a-zA-Z0-9_]+$/)
        .optional(),
      email: z.string().email().optional(),
      role: z.enum(['LEARNER', 'AUTHOR', 'MODERATOR', 'ADMIN']).optional(),
      bio: z.string().max(500).optional(),
      avatarUrl: z.string().url().nullable().optional(),
      totalXp: z.number().int().min(0).max(10_000_000).optional(),
      streakDays: z.number().int().min(0).max(10_000).optional(),
      excludedFromLeaderboard: z.boolean().optional()
    })
    .strict()
})

const banInput = z.object({
  id: z.string().min(1),
  until: z.union([z.string().datetime(), z.literal('permanent')]),
  reason: z.string().max(500)
})

const grantInput = z.object({ id: z.string().min(1), achievementId: z.string().min(1) })

const cursorInput = z.object({
  id: z.string().min(1),
  cursor: z.string().nullable().optional()
})

export const adminUsersRouter = createTRPCRouter({
  list: adminProcedure
    .input(listInput)
    .query(({ ctx, input }) => ctx.repositories.admin.users.list(input ?? {})),

  get: adminProcedure
    .input(userIdInput)
    .query(({ ctx, input }) => ctx.repositories.admin.users.get(input.id)),

  update: adminProcedure.input(updateInput).mutation(async ({ ctx, input }) => {
    if (input.patch.role === 'LEARNER' && input.id === ctx.user.id) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Нельзя снять с себя роль администратора через эту форму.'
      })
    }
    const next = await ctx.repositories.admin.users.update(input.id, input.patch)
    await invalidateProfileCachesForUserId(input.id)
    return next
  }),

  ban: adminProcedure.input(banInput).mutation(async ({ ctx, input }) => {
    if (input.id === ctx.user.id) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Нельзя забанить самого себя.' })
    }
    return ctx.repositories.admin.users.ban(input.id, {
      until: input.until,
      reason: input.reason
    })
  }),

  unban: adminProcedure
    .input(userIdInput)
    .mutation(({ ctx, input }) => ctx.repositories.admin.users.unban(input.id)),

  grantAchievement: adminProcedure.input(grantInput).mutation(async ({ ctx, input }) => {
    await ctx.repositories.admin.users.grantAchievement(input.id, input.achievementId)
    await invalidateProfileCachesForUserId(input.id)
    return { ok: true as const }
  }),

  revokeAchievement: adminProcedure.input(grantInput).mutation(async ({ ctx, input }) => {
    await ctx.repositories.admin.users.revokeAchievement(input.id, input.achievementId)
    await invalidateProfileCachesForUserId(input.id)
    return { ok: true as const }
  }),

  listAchievementStatus: adminProcedure
    .input(userIdInput)
    .query(({ ctx, input }) => ctx.repositories.admin.users.listAchievementStatus(input.id)),

  listActivity: adminProcedure
    .input(cursorInput)
    .query(({ ctx, input }) =>
      ctx.repositories.admin.users.listActivity(input.id, input.cursor ?? null)
    ),

  deleteActivity: adminProcedure
    .input(z.object({ activityId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const activity = await db.userActivity.findUnique({
        where: { id: input.activityId },
        select: { userId: true }
      })
      await ctx.repositories.admin.users.deleteActivity(input.activityId)
      if (activity) await invalidateProfileCachesForUserId(activity.userId)
      return { ok: true as const }
    }),

  listComments: adminProcedure
    .input(cursorInput)
    .query(({ ctx, input }) =>
      ctx.repositories.admin.users.listComments(input.id, input.cursor ?? null)
    )
})
