import 'server-only'
import { env } from '~/env'
import { redis } from './redis'

const SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
return { current, ttl }
`

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Fixed-window counter limiter. Atomic via a single Lua script so concurrent
 * requests never under- or over-count.
 */
export class RateLimiter {
  constructor(
    private readonly bucket: string,
    private readonly limit: number,
    private readonly windowSeconds: number
  ) {}

  async check(identity: string): Promise<RateLimitResult> {
    const key = `${env.RATE_LIMIT_REDIS_PREFIX}${this.bucket}:${identity}`
    const result = (await redis.eval(SCRIPT, 1, key, this.windowSeconds.toString())) as [
      number,
      number
    ]
    const [current, ttl] = result
    const remaining = Math.max(0, this.limit - current)
    return {
      allowed: current <= this.limit,
      remaining,
      retryAfterSeconds: ttl > 0 ? ttl : this.windowSeconds
    }
  }
}
