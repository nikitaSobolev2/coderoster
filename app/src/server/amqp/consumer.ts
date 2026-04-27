import 'server-only'
import type { ConsumeMessage } from 'amqplib'
import { getAmqpChannel } from './connection'

export interface ConsumerOptions {
  queue: string
  prefetch?: number
}

export type Handler = (payload: unknown, raw: ConsumeMessage) => Promise<void>

/**
 * Subscribe to a queue with manual acknowledgement. Failures are nack'd
 * without requeue so they end up on the configured dead-letter exchange.
 */
export async function startConsumer(options: ConsumerOptions, handler: Handler): Promise<void> {
  const channel = await getAmqpChannel()
  await channel.prefetch(options.prefetch ?? 4)
  await channel.consume(options.queue, message => {
    if (!message) return
    void processMessage(message)
  })

  async function processMessage(message: ConsumeMessage): Promise<void> {
    try {
      const payload = JSON.parse(message.content.toString('utf8')) as unknown
      await handler(payload, message)
      channel.ack(message)
    } catch (error) {
      console.error(`[amqp] consumer ${options.queue} failed`, error)
      channel.nack(message, false, false)
    }
  }
}
