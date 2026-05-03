import { headers } from 'next/headers'

import { env } from '~/env'

/**
 * Host + scheme derived from NEXT_PUBLIC_WORKOS_REDIRECT_URI (must match WorkOS dashboard).
 *
 * AuthKit's `handleAuth()` builds Location from `request.url` when `baseURL` is omitted. Behind nginx
 * or docker port mapping Next often sees `http://localhost:3000`, which sends users to
 * localhost after OAuth. Use this for post-auth redirects and logout return targets.
 */
export function canonicalPublicOrigin(): string {
  return new URL(env.NEXT_PUBLIC_WORKOS_REDIRECT_URI).origin
}

/**
 * Current request origin (scheme + host) when headers are trustworthy (`x-forwarded-*`, `host`).
 * Prefer {@link canonicalPublicOrigin} for WorkOS round-trips when the stack may disagree with the browser URL.
 */
export async function resolveRequestOrigin(): Promise<string> {
  const h = await headers()
  const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? 'http'
  const hostRaw = h.get('x-forwarded-host') ?? h.get('host')
  const host = hostRaw?.split(',')[0]?.trim()
  if (!host) {
    return 'http://localhost:3000'
  }
  return `${proto}://${host}`
}
