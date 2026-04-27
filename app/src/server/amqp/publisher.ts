import 'server-only'
import { EXCHANGE, getAmqpChannel } from './connection'

/**
 * Publishes a single message to the platform-wide topic exchange and waits
 * for the broker confirm so callers can roll back outbox state on failure.
 */
export async function publishEvent(topic: string, payload: object): Promise<void> {
  const channel = await getAmqpChannel()
  const ok = channel.publish(EXCHANGE, topic, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: 'application/json'
  })
  if (!ok) {
    await new Promise<void>(resolve => channel.once('drain', resolve))
  }
}
