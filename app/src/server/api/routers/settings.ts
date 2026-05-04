import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { idempotentProcedure } from '~/server/api/procedures'
import { invalidateProfileCachesForUsername } from '~/server/cache/invalidateProfileCaches'
import { isBootstrapAdminEmail } from '~/server/auth/bootstrapAdminEmail'
import { userSyncService } from '~/server/services/UserSyncService'
import type { UserRole } from '~/server/repositories/types'

const socialsSchema = z
  .object({
    github: z.string().url().nullable().optional(),
    linkedin: z.string().url().nullable().optional(),
    x: z.string().url().nullable().optional(),
    website: z.string().url().nullable().optional()
  })
  .partial()

const platformRoleSchema = z.enum([
  'learner',
  'author',
  'moderator',
  'admin'
]) satisfies z.ZodType<UserRole>

const updateSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  username: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_]+$/i, 'Только латиница, цифры и подчёркивание')
    .optional(),
  bio: z.string().max(400).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  socials: socialsSchema.optional(),
  appearance: z
    .object({ colorScheme: z.enum(['dark', 'light']) })
    .partial()
    .optional()
})

/**
 * Settings router. Strategy switching (Fake vs Prisma) lives in the repository
 * layer, so this router stays thin and unaware of `USE_FAKE_DATA`. After a
 * successful update we bust the profile + achievements caches keyed by
 * username so a freshly-renamed user gets a clean view immediately.
 */
export const settingsRouter = createTRPCRouter({
  getMine: protectedProcedure.query(({ ctx }) => ctx.repositories.settings.getMine(ctx.user.id)),

  update: idempotentProcedure.input(updateSchema).mutation(async ({ ctx, input }) => {
    const previous = await ctx.repositories.settings.getMine(ctx.user.id)
    try {
      const next = await ctx.repositories.settings.update(ctx.user.id, input)
      await invalidateUserCaches(previous.username)
      if (next.username !== previous.username) {
        await invalidateUserCaches(next.username)
      }
      await userSyncService.invalidate(ctx.user.id)
      return next
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Никнейм занят. Попробуй другой.'
        })
      }
      throw error
    }
  }),

  /**
   * Dev/staging: user whose DB email matches `ADMIN_BOOTSTRAP_EMAIL` may set platform `Role`.
   * Guarded by DB email + flag; does not change WorkOS directory metadata.
   */
  updateBootstrapSelfRole: idempotentProcedure
    .input(z.object({ role: platformRoleSchema }))
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: { email: true }
      })
      if (!row?.email || !isBootstrapAdminEmail(row.email)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Смена роли доступна только для аккаунта из ADMIN_BOOTSTRAP_EMAIL.'
        })
      }
      const previous = await ctx.repositories.settings.getMine(ctx.user.id)
      if (!previous.allowSelfRoleChange) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Смена роли недоступна.'
        })
      }
      const next = await ctx.repositories.settings.updatePlatformRole(ctx.user.id, input.role)
      await invalidateUserCaches(previous.username)
      await userSyncService.invalidate(ctx.user.id)
      return next
    })
})

async function invalidateUserCaches(username: string): Promise<void> {
  await invalidateProfileCachesForUsername(username)
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  )
}
