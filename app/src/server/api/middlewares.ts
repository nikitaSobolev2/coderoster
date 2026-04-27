import 'server-only'
import { TRPCError } from '@trpc/server'
import { createHash } from 'crypto'
import { Prisma } from '@prisma/client'
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
