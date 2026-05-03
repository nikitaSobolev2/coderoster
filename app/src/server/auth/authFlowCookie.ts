import 'server-only'

import { sealData, unsealData } from 'iron-session'
import { cookies } from 'next/headers'

import { AUTH_FLOW_COOKIE, AUTH_FLOW_COOKIE_MAX_AGE } from '~/features/authentication/constants'
import type { AuthFlowCookiePayload } from '~/features/authentication/validation/schemas'
import { authFlowCookieSchema } from '~/features/authentication/validation/schemas'
import { env } from '~/env'

function secureFromRedirectUri(): boolean {
  try {
    return new URL(env.NEXT_PUBLIC_WORKOS_REDIRECT_URI).protocol === 'https:'
  } catch {
    return process.env.NODE_ENV === 'production'
  }
}

export async function setAuthFlowCookie(payload: AuthFlowCookiePayload): Promise<void> {
  const sealed = await sealData(payload, {
    password: env.WORKOS_COOKIE_PASSWORD,
    ttl: AUTH_FLOW_COOKIE_MAX_AGE
  })
  const jar = await cookies()
  jar.set(AUTH_FLOW_COOKIE, sealed, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: secureFromRedirectUri(),
    maxAge: AUTH_FLOW_COOKIE_MAX_AGE
  })
}

export async function getAuthFlowCookie(): Promise<AuthFlowCookiePayload | null> {
  const jar = await cookies()
  const raw = jar.get(AUTH_FLOW_COOKIE)?.value
  if (!raw) return null
  try {
    const data = await unsealData(raw, { password: env.WORKOS_COOKIE_PASSWORD })
    const parsed = authFlowCookieSchema.safeParse(data)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export async function clearAuthFlowCookie(): Promise<void> {
  const jar = await cookies()
  jar.delete(AUTH_FLOW_COOKIE)
}
