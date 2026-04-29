import 'server-only'
import { createHash, createHmac, timingSafeEqual } from 'crypto'

import { env } from '~/env'

export function livechatGuestSigningKey(): Buffer {
  if (env.LIVECHAT_GUEST_SECRET) {
    return Buffer.from(env.LIVECHAT_GUEST_SECRET, 'utf8')
  }
  return createHash('sha256')
    .update(`${env.WORKOS_COOKIE_PASSWORD}:coderoster_livechat_guest`)
    .digest()
}

export function signGuestSessionToken(sessionId: string): string {
  const sig = createHmac('sha256', livechatGuestSigningKey()).update(sessionId).digest('hex')
  return `${sessionId}.${sig}`
}

export function verifyGuestSessionToken(token: string): string | null {
  const dot = token.indexOf('.')
  if (dot < 1) return null
  const sessionId = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!/^[a-f0-9]{32}$/.test(sessionId) || !/^[a-f0-9]{64}$/.test(sig)) return null
  const expected = createHmac('sha256', livechatGuestSigningKey()).update(sessionId).digest('hex')
  try {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  return sessionId
}

export function parseGuestSessionFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(/(?:^|;\s*)livechat_guest=([^;]+)/)
  const raw = match?.[1]
  if (!raw) return null
  try {
    return verifyGuestSessionToken(decodeURIComponent(raw))
  } catch {
    return null
  }
}
