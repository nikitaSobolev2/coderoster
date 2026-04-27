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

async function resolveCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await withAuth()
    if (!session.user) return null

    if (isTruthyFlag(env.USE_FAKE_DATA)) {
      console.log('[trpc] FAKE branch hit', {
        workosId: session.user.id,
        email: session.user.email
      })
      const fallbackName = session.user.firstName ?? session.user.email
      return {
        id: session.user.id,
        username: session.user.email.split('@')[0] ?? session.user.id,
        email: session.user.email,
        displayName: fallbackName ?? session.user.email
      }
    }

    const local = await userSyncService.syncFromSession({
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName ?? null,
      lastName: session.user.lastName ?? null,
      profilePictureUrl: session.user.profilePictureUrl ?? null
    })
    console.log('[trpc] resolved user', {
      workosId: session.user.id,
      localId: local.id,
      username: local.username,
      email: local.email
    })
    return {
      id: local.id,
      username: local.username,
      email: local.email,
      displayName: local.displayName
    }
  } catch (error) {
    console.error('[trpc] resolveCurrentUser failed', error)
    return null
  }
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
  const end = Date.now()
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`)
  return result
})

const requireAuthMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign in required.' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})

/** Public procedure — `ctx.user` may be null. */
export const publicProcedure = t.procedure.use(timingMiddleware)

/** Protected procedure — guarantees `ctx.user` is non-null. */
export const protectedProcedure = t.procedure.use(timingMiddleware).use(requireAuthMiddleware)
