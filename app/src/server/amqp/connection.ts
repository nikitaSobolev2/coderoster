import 'server-only'
import * as amqp from 'amqplib'
import { env } from '~/env'

export const EXCHANGE = 'coderoster.events'
export const DLX = 'coderoster.dlx'

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
  await channel.assertQueue(queue, {
    durable: true,
    arguments: { 'x-dead-letter-exchange': DLX }
  })
  await channel.bindQueue(queue, EXCHANGE, topic)
  declared.add(key)
}
