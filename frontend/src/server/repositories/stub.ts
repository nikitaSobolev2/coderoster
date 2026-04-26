import { TRPCError } from '@trpc/server'

/**
 * Placeholder used by Prisma-backed repository methods until the backend
 * is wired up. Forces callers to enable `USE_FAKE_DATA=true` for now.
 */
export function stubNotImplemented(symbol: string): never {
  throw new TRPCError({
    code: 'NOT_IMPLEMENTED',
    message: `${symbol} is not implemented. Set USE_FAKE_DATA=true while the backend is being built.`
  })
}
