import 'server-only'
import type { Prisma } from '@prisma/client'
import { db } from '~/server/db'
import { CircuitBreaker, CircuitBreakerOpenError } from '~/server/lib/CircuitBreaker'
import { publishEvent } from '~/server/amqp/publisher'

const POLL_INTERVAL_MS = 500
const BATCH_SIZE = 50
const MAX_RETRIES = 5

const breaker = new CircuitBreaker({
  name: 'outbox.publish',
  failureThreshold: 5,
  cooldownMs: 30_000
})

let stopRequested = false

/**
 * Polling outbox dispatcher. One process per stack — uses
 * `FOR UPDATE SKIP LOCKED` to make it horizontally scalable later. Wrapped in
 * a circuit breaker so a flapping RabbitMQ doesn't burn through retries.
 */
async function tick(): Promise<void> {
  if (breaker.isOpen()) {
    return
  }
  const events = await db.$transaction(async tx => {
    const pending = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "OutboxEvent"
      WHERE status = 'PENDING' AND retries < ${MAX_RETRIES}
      ORDER BY "createdAt" ASC
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    `
    if (pending.length === 0) return []
    const ids = pending.map(row => row.id)
    return tx.outboxEvent.findMany({ where: { id: { in: ids } } })
  })

  for (const event of events) {
    try {
      await breaker.run(() => publishEvent(event.topic, event.payload as object))
      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          lastError: null
        }
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      const nextRetries = event.retries + 1
      const status: Prisma.EnumOutboxStatusFieldUpdateOperationsInput['set'] | undefined =
        nextRetries >= MAX_RETRIES ? 'FAILED' : undefined
      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          retries: nextRetries,
          lastError: message,
          ...(status ? { status } : {})
        }
      })
      if (error instanceof CircuitBreakerOpenError) break
    }
  }
}

export async function runOutboxDispatcher(): Promise<void> {
  console.log('[outbox] dispatcher starting')
  while (!stopRequested) {
    try {
      await tick()
    } catch (error) {
      console.error('[outbox] tick failed', error)
    }
    await sleep(POLL_INTERVAL_MS)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    stopRequested = true
  })
  process.on('SIGINT', () => {
    stopRequested = true
  })
}

if (import.meta.url.startsWith('file:') && process.argv[1]?.endsWith('dispatcher.ts')) {
  runOutboxDispatcher().catch(error => {
    console.error('[outbox] fatal', error)
    process.exit(1)
  })
}
