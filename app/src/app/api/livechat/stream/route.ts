import { LIVECHAT_REDIS_CHANNEL } from '~/server/livechat/broadcast'
import { redis } from '~/server/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const subscriber = redis.duplicate()

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await subscriber.subscribe(LIVECHAT_REDIS_CHANNEL)
      } catch (error) {
        controller.error(error)
        subscriber.quit().catch(() => {})
        return
      }

      const pushJson = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      }

      pushJson({ type: 'hello', ts: Date.now() })

      const onMessage = (_channel: string, message: string) => {
        try {
          pushJson(JSON.parse(message))
        } catch {
          /* malformed publish ignored */
        }
      }

      subscriber.on('message', onMessage)

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'))
      }, 30_000)

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        subscriber.off('message', onMessage)
        subscriber.unsubscribe(LIVECHAT_REDIS_CHANNEL).catch(() => {})
        subscriber.quit().catch(() => {})
        try {
          controller.close()
        } catch {
          /* noop */
        }
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}
