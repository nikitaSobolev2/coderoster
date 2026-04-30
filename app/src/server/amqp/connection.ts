import 'server-only'
import * as amqp from 'amqplib'
import type { Options } from 'amqplib'
import { env } from '~/env'

export const EXCHANGE = 'coderoster.events'
export const DLX = 'coderoster.dlx'

/**
 * Per-queue assert options — must match `infra/compose/rabbitmq/definitions.json`
 * or RabbitMQ returns 406 PRECONDITION_FAILED on `queue.declare` (inequivalent args).
 */
const BROKER_QUEUE_ASSERT: Record<string, Options.AssertQueue> = {
  'execution.requested': {
    durable: true,
    arguments: {
      'x-message-ttl': 600_000,
      'x-dead-letter-exchange': DLX,
      'x-dead-letter-routing-key': 'execution.requested.dead'
    }
  },
  'execution.completed': {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': DLX,
      'x-dead-letter-routing-key': 'execution.completed.dead'
    }
  },
  'ai.code_improve.requested': {
    durable: true,
    arguments: {
      'x-message-ttl': 600_000,
      'x-dead-letter-exchange': DLX,
      'x-dead-letter-routing-key': 'ai.code_improve.requested.dead'
    }
  }
}

type ChannelModel = Awaited<ReturnType<typeof amqp.connect>>

declare global {
  var __amqpConnection: ChannelModel | undefined

  var __amqpChannel: amqp.Channel | undefined
}

/**
 * Process-level connection + confirm channel. Reused by every publisher and
 * consumer so we open a single TCP connection per Node process.
 */
export async function getAmqpChannel(): Promise<amqp.Channel> {
  if (globalThis.__amqpChannel) return globalThis.__amqpChannel
  const connection = await amqp.connect(env.RABBITMQ_URL)
  connection.on('error', error => console.error('[amqp] connection error', error))
  connection.on('close', () => {
    globalThis.__amqpConnection = undefined
    globalThis.__amqpChannel = undefined
  })
  globalThis.__amqpConnection = connection

  const channel = await connection.createChannel()
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true })
  await channel.assertExchange(DLX, 'topic', { durable: true })
  globalThis.__amqpChannel = channel
  return channel
}

export async function closeAmqp(): Promise<void> {
  await globalThis.__amqpChannel?.close()
  await globalThis.__amqpConnection?.close()
  globalThis.__amqpChannel = undefined
  globalThis.__amqpConnection = undefined
}

const declared = new Set<string>()

/**
 * Asserts a durable queue and binds it to the platform exchange under the
 * given topic. Idempotent: each (queue, topic) pair runs once per process.
 * Required because queues are not pre-declared in the broker config.
 */
export async function ensureQueueBound(queue: string, topic: string): Promise<void> {
  const key = `${queue}::${topic}`
  if (declared.has(key)) return
  const channel = await getAmqpChannel()
  const assertOptions = BROKER_QUEUE_ASSERT[queue] ?? {
    durable: true,
    arguments: { 'x-dead-letter-exchange': DLX }
  }
  await channel.assertQueue(queue, assertOptions)
  await channel.bindQueue(queue, EXCHANGE, topic)
  declared.add(key)
}
