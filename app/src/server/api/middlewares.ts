import 'server-only'
import { TRPCError } from '@trpc/server'
import { createHash } from 'crypto'
import { Prisma, type Role } from '@prisma/client'
import { db } from '~/server/db'
import { RateLimiter } from '~/server/rateLimit'
import { t, type TRPCContext } from './trpc'

const trpcMiddleware = t.middleware

const IDEMPOTENCY_TTL_HOURS = 24

/**
 * Creates a tRPC middleware that enforces a Redis-backed rate limit.
 * Identity prefers the authenticated user id, falling back to the source IP
 * extracted from `x-forwarded-for` so anonymous traffic is still bounded.
 */
export function withRateLimit(name: string, limit: number, windowSeconds: number) {
  const limiter = new RateLimiter(name, limit, windowSeconds)
  return trpcMiddleware(async ({ ctx, next }) => {
    const identity = identityOf(ctx)
    const result = await limiter.check(identity)
    if (!result.allowed) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Слишком много запросов. Попробуй через ${result.retryAfterSeconds} с.`
      })
    }
    return next()
  })
}

/**
 * Idempotency middleware. Reads the `idempotency-key` HTTP header from
 * `ctx.headers`, persists the first response, and replays it for duplicates
 * arriving within the configured TTL.
 */
export function withIdempotency() {
  return trpcMiddleware(async ({ ctx, next, path }) => {
    const key = ctx.headers.get('idempotency-key')
    if (!key) return next()
    if (!ctx.user) return next()

    const fingerprint = createHash('sha256').update(`${path}::${key}`).digest('hex')
    const existing = await db.idempotencyKey.findUnique({ where: { key: fingerprint } })

    if (existing?.status === 'COMPLETED' && existing.response !== null) {
      return existing.response as never
    }
    if (existing?.status === 'IN_PROGRESS' && existing.expiresAt > new Date()) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Запрос с такой idempotency-key ещё обрабатывается.'
      })
    }

    await db.idempotencyKey.upsert({
      where: { key: fingerprint },
      update: {
        status: 'IN_PROGRESS',
        endpoint: path,
        userId: ctx.user.id,
        response: Prisma.JsonNull,
        expiresAt: nowPlusHours(IDEMPOTENCY_TTL_HOURS)
      },
      create: {
        key: fingerprint,
        endpoint: path,
        userId: ctx.user.id,
        status: 'IN_PROGRESS',
        expiresAt: nowPlusHours(IDEMPOTENCY_TTL_HOURS)
      }
    })

    try {
      const result = await next()
      if (result.ok) {
        await db.idempotencyKey.update({
          where: { key: fingerprint },
          data: {
            status: 'COMPLETED',
            response: serializeForJson(result.data)
          }
        })
      } else {
        await db.idempotencyKey.update({
          where: { key: fingerprint },
          data: { status: 'FAILED' }
        })
      }
      return result
    } catch (error) {
      await db.idempotencyKey.update({
        where: { key: fingerprint },
        data: { status: 'FAILED' }
      })
      throw error
    }
  })
}

/**
 * Gate procedure to one of the given Prisma `Role` values. Re-checks DB every
 * call so role downgrades apply immediately (no stale ctx).
 */
export function withRequireRoles(allowed: readonly Role[]) {
  const allowedSet = new Set<Role>(allowed)
  return trpcMiddleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign in required.' })
    }
    const fresh = await db.user.findUnique({
      where: { id: ctx.user.id },
      select: { role: true, bannedUntil: true }
    })
    if (!fresh) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign in required.' })
    }
    if (fresh.bannedUntil && fresh.bannedUntil > new Date()) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Account suspended.' })
    }
    if (!allowedSet.has(fresh.role)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' })
    }
    return next()
  })
}

/**
 * Gate procedure to admin role only. Re-checks DB on every call so a freshly
 * revoked admin loses access immediately (no stale ctx).
 */
export function withRequireAdmin() {
  return withRequireRoles(['ADMIN'])
}

/**
 * Append-only admin audit. Fires on every successful admin mutation; failures
 * are intentionally not logged here — Sentry / logs cover those.
 */
export function withAuditLog() {
  return trpcMiddleware(async opts => {
    const { ctx, next, path, type, getRawInput } = opts
    const result = await next()
    if (!result.ok) return result
    if (type !== 'mutation') return result
    if (!ctx.user) return result
    let rawInput: unknown = null
    try {
      rawInput = await getRawInput()
    } catch {
      rawInput = null
    }
    const target = extractTarget(rawInput)
    db.auditLog
      .create({
        data: {
          actorId: ctx.user.id,
          action: path,
          targetType: target.type,
          targetId: target.id,
          diff: safeJson(rawInput)
        }
      })
      .catch((error: unknown) => console.error('[audit] failed to write', { path, error }))
    return result
  })
}

function extractTarget(rawInput: unknown): { type: string; id: string } {
  if (!rawInput || typeof rawInput !== 'object') return { type: '-', id: '-' }
  const input = rawInput as Record<string, unknown>
  const id = pickFirstString(input, ['id', 'userId', 'courseId', 'taskId', 'pageId', 'slug'])
  return { type: '-', id: id ?? '-' }
}

function pickFirstString(input: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'string' && value.length > 0) return value
  }
  return null
}

function safeJson(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) return Prisma.JsonNull as never
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
  } catch {
    return Prisma.JsonNull as never
  }
}

function identityOf(ctx: TRPCContext): string {
  if (ctx.user) return `user:${ctx.user.id}`
  const xff = ctx.headers.get('x-forwarded-for') ?? ctx.headers.get('x-real-ip') ?? 'unknown'
  return `ip:${xff.split(',')[0]?.trim() ?? 'unknown'}`
}

function nowPlusHours(hours: number): Date {
  return new Date(Date.now() + hours * 3_600_000)
}

function serializeForJson(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) return Prisma.JsonNull as never
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}
