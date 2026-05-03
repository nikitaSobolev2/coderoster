import 'server-only'

/**
 * Prefer first hop of X-Forwarded-For for Redis-backed rate limiting keys.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const xff = headers.get('x-forwarded-for') ?? headers.get('x-real-ip') ?? 'unknown'
  return xff.split(',')[0]?.trim() ?? 'unknown'
}
