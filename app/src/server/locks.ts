import 'server-only'
import { randomUUID } from 'crypto'
import { redis } from './redis'

const RELEASE_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
else
  return 0
end
`

/**
 * Acquire a single-node lock for `key` and run `fn`. The token check on release
 * prevents one consumer from accidentally releasing a lock another worker is
 * still holding after a slow operation outlives the TTL.
 */
export async function withLock<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const token = randomUUID()
  const acquired = await redis.set(`lock:${key}`, token, 'EX', ttlSeconds, 'NX')
  if (acquired !== 'OK') {
    throw new Error(`Lock busy: ${key}`)
  }
  try {
    return await fn()
  } finally {
    await redis.eval(RELEASE_SCRIPT, 1, `lock:${key}`, token)
  }
}
