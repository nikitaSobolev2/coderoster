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
