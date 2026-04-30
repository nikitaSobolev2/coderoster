import 'server-only'
import { redis } from './redis'

const NULL_MARKER = '__null__'

/**
 * Thin wrapper around Redis used by repository decorators. Centralises the
 * serialization and the null-marker contract so every caller treats `null`
 * as a cacheable result.
 */
export const cache = {
  async wrap<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await redis.get(key)
    if (cached !== null) {
      return cached === NULL_MARKER ? (null as T) : (JSON.parse(cached) as T)
    }
    const fresh = await loader()
    await redis.set(
      key,
      fresh === null || fresh === undefined ? NULL_MARKER : JSON.stringify(fresh),
      'EX',
      ttlSeconds
    )
    return fresh
  },

  async del(key: string): Promise<void> {
    await redis.del(key)
  },

  async delPrefix(prefix: string): Promise<void> {
    const stream = redis.scanStream({ match: `${prefix}*`, count: 200 })
    const pipeline = redis.pipeline()
    let queued = 0
    for await (const keys of stream) {
      const list = keys as string[]
      if (list.length === 0) continue
      pipeline.del(...list)
      queued += list.length
    }
    if (queued > 0) await pipeline.exec()
  },

  /** Redis SCAN `match` glob (e.g. `lesson:*:u:someUserId`). */
  async delMatch(match: string): Promise<void> {
    const stream = redis.scanStream({ match, count: 200 })
    const pipeline = redis.pipeline()
    let queued = 0
    for await (const keys of stream) {
      const list = keys as string[]
      if (list.length === 0) continue
      pipeline.del(...list)
      queued += list.length
    }
    if (queued > 0) await pipeline.exec()
  }
}
