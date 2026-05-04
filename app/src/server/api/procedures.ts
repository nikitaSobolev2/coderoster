import 'server-only'
import { protectedProcedure, publicProcedure } from './trpc'
import {
  withAuditLog,
  withIdempotency,
  withRateLimit,
  withRequireAdmin,
  withRequireRoles
} from './middlewares'

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

export const aiImproveProcedure = idempotentProcedure.use(withRateLimit('ai_improve', 8, 3_600))

/**
 * Comment mutations: idempotent + 5 calls / minute / user. Spam guard.
 */
export const commentProcedure = idempotentProcedure.use(withRateLimit('comment', 5, 60))

export const livechatReadProcedure = publicProcedure.use(withRateLimit('livechat_read', 180, 60))
export const livechatSendProcedure = publicProcedure.use(withRateLimit('livechat_send', 15, 60))
export const livechatConsentProcedure = publicProcedure.use(
  withRateLimit('livechat_consent', 30, 60)
)

/** Public procedure with a generic 60 / minute / IP rate limit. */
export const publicLimitedProcedure = publicProcedure.use(withRateLimit('public', 60, 60))

/** Public procedure tuned for search: 30 / minute / IP. */
export const searchProcedure = publicProcedure.use(withRateLimit('search', 30, 60))

/**
 * Admin procedure: requires `role === 'ADMIN'` and writes every successful
 * mutation to the `AuditLog`. Use for every CRUD endpoint under
 * `app/src/server/api/routers/admin/`.
 */
export const adminProcedure = protectedProcedure.use(withRequireAdmin()).use(withAuditLog())

/** Moderation / challenges: `MODERATOR` or `ADMIN`, audit mutations. */
export const moderatorProcedure = protectedProcedure
  .use(withRequireRoles(['MODERATOR', 'ADMIN']))
  .use(withAuditLog())

/** Teacher catalog & course editor: `AUTHOR` or `ADMIN`, audit mutations. */
export const authorStaffProcedure = protectedProcedure
  .use(withRequireRoles(['AUTHOR', 'ADMIN']))
  .use(withAuditLog())
