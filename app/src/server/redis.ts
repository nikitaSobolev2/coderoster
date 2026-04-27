import 'server-only'
import Redis from 'ioredis'
import { env } from '~/env'

declare global {
  var __redisClient: Redis | undefined
}

/**
 * Single Redis connection shared by every server-side concern (cache,
 * rate-limit, locks). Hot-reload safe via the global cache.
 */
export const redis: Redis =
  globalThis.__redisClient ??
  new Redis(env.REDIS_URL, {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    reconnectOnError: () => true
  })

if (env.NODE_ENV !== 'production') {
  globalThis.__redisClient = redis
}

redis.on('error', error => {
  console.error('[redis] connection error', error.message)
})
