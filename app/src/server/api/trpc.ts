/**
 * tRPC server bootstrap. Owns the request context, transformer, error formatting
 * and the procedure builders (`publicProcedure` / `protectedProcedure`).
 */
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { withAuth } from '@workos-inc/authkit-nextjs'

import { env } from '~/env'
import { db } from '~/server/db'
import { isTruthyFlag } from '~/server/lib/featureFlags'
import { getAppRepositories, type Repositories } from '~/server/repositories'
import type { AuthenticatedUser } from '~/server/repositories/types'
import { userSyncService } from '~/server/services/UserSyncService'

export interface TRPCContextOptions {
  headers: Headers
}

export interface TRPCContext {
  db: typeof db
  headers: Headers
  repositories: Repositories
  user: AuthenticatedUser | null
}

/**
 * Build the per-request tRPC context. Resolves the authenticated user from
 * WorkOS once so every procedure shares a single auth check.
 */
export const createTRPCContext = async (opts: TRPCContextOptions): Promise<TRPCContext> => {
  const user = await resolveCurrentUser()
  return {
    db,
    headers: opts.headers,
    repositories: getAppRepositories(),
    user
  }
}

export async function resolveCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await withAuth()
    if (!session.user) return null

    if (isTruthyFlag(env.USE_FAKE_DATA)) {
      if (env.NODE_ENV === 'development') {
        console.log('[trpc] USE_FAKE_DATA: session resolved (redacted)')
      }
      const fallbackName = session.user.firstName ?? session.user.email
      return {
        id: session.user.id,
        username: session.user.email.split('@')[0] ?? session.user.id,
        email: session.user.email,
        displayName: fallbackName ?? session.user.email,
        role: 'learner',
        bannedUntil: null,
        banReason: null,
        chatBannedUntil: null,
        chatBanReason: null,
        livechatConsentAt: null,
        livechatUsernameColor: null
      }
    }

    const local = await userSyncService.syncFromSession({
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName ?? null,
      lastName: session.user.lastName ?? null,
      profilePictureUrl: session.user.profilePictureUrl ?? null
    })
    if (env.NODE_ENV === 'development') {
      console.log('[trpc] resolved user', { localId: local.id, username: local.username })
    }
    return {
      id: local.id,
      username: local.username,
      email: local.email,
      displayName: local.displayName,
      role: local.role.toLowerCase() as AuthenticatedUser['role'],
      bannedUntil: local.bannedUntil,
      banReason: local.banReason,
      chatBannedUntil: local.chatBannedUntil,
      chatBanReason: local.chatBanReason,
      livechatConsentAt: local.livechatConsentAt,
      livechatUsernameColor: local.livechatUsernameColor
    }
  } catch (error) {
    console.error('[trpc] resolveCurrentUser failed', error)
    return null
  }
}

function logProcedureTiming(path: string, durationMs: number): void {
  if (env.NODE_ENV !== 'development') return
  console.log(`[TRPC] ${path} took ${durationMs}ms`)
}

export const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
      }
    }
  }
})

export const createCallerFactory = t.createCallerFactory
export const createTRPCRouter = t.router

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now()
  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 200) + 50
    await new Promise(resolve => setTimeout(resolve, waitMs))
  }
  const result = await next()
  logProcedureTiming(path, Date.now() - start)
  return result
})

const requireAuthMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign in required.' })
  }
  if (isCurrentlyBanned(ctx.user.bannedUntil) && ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: ctx.user.banReason ?? 'Аккаунт заблокирован.'
    })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})

function isCurrentlyBanned(bannedUntil: Date | null | undefined): boolean {
  if (!bannedUntil) return false
  return bannedUntil.getTime() > Date.now()
}

/** Public procedure — `ctx.user` may be null. */
export const publicProcedure = t.procedure.use(timingMiddleware)

/** Protected procedure — guarantees `ctx.user` is non-null. */
export const protectedProcedure = t.procedure.use(timingMiddleware).use(requireAuthMiddleware)
