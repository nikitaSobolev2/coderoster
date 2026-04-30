import 'server-only'
import { TRPCError } from '@trpc/server'
import { redis } from '~/server/redis'
import { aiImproveCircuitOpenUntilKey } from '~/server/lib/aiImproveKeys'

export async function assertAiImproveCircuitClosed(): Promise<void> {
  const raw = await redis.get(aiImproveCircuitOpenUntilKey())
  if (!raw) return
  const until = Number(raw)
  if (!Number.isFinite(until)) return
  if (until > Date.now()) {
    throw new TRPCError({
      code: 'SERVICE_UNAVAILABLE',
      message: 'ИИ временно перегружен. Попробуй через пару минут.'
    })
  }
}
