import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { signupProfileSchema } from '~/features/authentication/validation/schemas'
import { checkAuthRateLimit } from '~/server/auth/authRateLimit'
import {
  clearAuthFlowCookie,
  getAuthFlowCookie,
  setAuthFlowCookie
} from '~/server/auth/authFlowCookie'
import { clientIpFromHeaders } from '~/server/auth/clientIp'

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers)
  const rl = await checkAuthRateLimit('signup', `signup-profile:${ip}`)
  if (!rl.allowed) {
    const res = NextResponse.json(
      { error: `Слишком много попыток. Попробуй через ${rl.retryAfterSeconds} с.` },
      { status: 429 }
    )
    res.headers.set('Retry-After', String(rl.retryAfterSeconds))
    return res
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный JSON' }, { status: 400 })
  }

  const parsed = signupProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Проверь поля', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const hint = await getAuthFlowCookie()
  const emailLower = parsed.data.email.trim().toLowerCase()
  if (hint?.kind === 'signup_hint' && hint.email.toLowerCase() !== emailLower) {
    return NextResponse.json(
      { error: 'Используй тот же email, что на прошлом шаге — или начни заново с /login.' },
      { status: 400 }
    )
  }

  await clearAuthFlowCookie()

  await setAuthFlowCookie({
    kind: 'signup',
    email: emailLower,
    firstName: parsed.data.firstName.trim(),
    lastName: parsed.data.lastName.trim(),
    personalDataProcessingConsentAt: new Date().toISOString()
  })

  return NextResponse.json({ ok: true, nextPath: '/signup/password' as const })
}
