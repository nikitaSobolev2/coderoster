import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { idempotentProcedure } from '~/server/api/procedures'
import { cache } from '~/server/cache'
import { cacheKeys } from '~/server/repositories/cached'
import { userSyncService } from '~/server/services/UserSyncService'

const socialsSchema = z
  .object({
    github: z.string().url().nullable().optional(),
    linkedin: z.string().url().nullable().optional(),
    x: z.string().url().nullable().optional(),
    website: z.string().url().nullable().optional()
  })
  .partial()

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
  })
})

async function invalidateUserCaches(username: string): Promise<void> {
  await Promise.all([
    cache.del(cacheKeys.profile(username, null)),
    cache.del(cacheKeys.achievements(username)),
    cache.delPrefix(`profile:${username.toLowerCase()}:`)
  ])
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  )
}
