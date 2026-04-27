import 'server-only'
import { protectedProcedure, publicProcedure } from './trpc'
import { withIdempotency, withRateLimit } from './middlewares'

/**
 * Mutations that should be replayable by clients. Reads `idempotency-key`
 * from the request headers; first call persists the response, duplicates
 * within 24h replay it.
 */
export const idempotentProcedure = protectedProcedure.use(withIdempotency())

/**
 * Heavy operations such as code execution. Combines the idempotent procedure
 * with a 10-call-per-minute Redis rate limit per user.
 */
export const heavyProcedure = idempotentProcedure.use(withRateLimit('exec', 10, 60))

/**
 * Comment mutations: idempotent + 5 calls / minute / user. Spam guard.
 */
export const commentProcedure = idempotentProcedure.use(withRateLimit('comment', 5, 60))

/** Public procedure with a generic 60 / minute / IP rate limit. */
export const publicLimitedProcedure = publicProcedure.use(withRateLimit('public', 60, 60))

/** Public procedure tuned for search: 30 / minute / IP. */
export const searchProcedure = publicProcedure.use(withRateLimit('search', 30, 60))
