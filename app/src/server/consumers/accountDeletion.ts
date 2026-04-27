import 'server-only'
import { z } from 'zod'
import { startConsumer } from '~/server/amqp/consumer'
import { accountDeletionService } from '~/server/services/AccountDeletionService'
import { cache } from '~/server/cache'

const QUEUE = 'account.deletion.requested'

const payloadSchema = z.object({
  userId: z.string().min(1),
  requestedAt: z.string()
})

/**
 * Drains the account-deletion queue. The publisher is the outbox dispatcher
 * fed by `account.requestDeletion`, so this consumer acts on a request that
 * has already been confirmed by the user inside the request lifecycle.
 */
async function handleEvent(payload: unknown): Promise<void> {
  const event = payloadSchema.parse(payload)
  const result = await accountDeletionService.delete(event.userId)
  if (!result.workosUserId) {
    console.warn('[consumer] account deletion: user missing', event.userId)
    return
  }
  await cache.delPrefix('profile:')
  await cache.delPrefix('comments:')
  await cache.delPrefix('leaderboard:')
}

export async function runAccountDeletionConsumer(): Promise<void> {
  console.log('[consumer] account-deletion-consumer starting')
  await startConsumer({ queue: QUEUE, prefetch: 4 }, handleEvent)
}

if (
  import.meta.url.startsWith('file:') &&
  process.argv[1]?.endsWith('accountDeletion.ts')
) {
  runAccountDeletionConsumer().catch(error => {
    console.error('[consumer] account deletion fatal', error)
    process.exit(1)
  })
}
