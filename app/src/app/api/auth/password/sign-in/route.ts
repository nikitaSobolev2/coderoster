import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { POST_AUTH_REDIRECT_PATH } from '~/features/authentication/constants'
import { emailSchema, passwordSchema } from '~/features/authentication/validation/schemas'
import { checkAuthRateLimit } from '~/server/auth/authRateLimit'
import { getAuthFlowCookie, setAuthFlowCookie } from '~/server/auth/authFlowCookie'
import { clientIpFromHeaders } from '~/server/auth/clientIp'
import { mapAuthKitErrorToMessage, workOsAuthService } from '~/server/auth/workOsAuthService'

const bodySchema = emailSchema.merge(passwordSchema)

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers)
  const rl = await checkAuthRateLimit('password', `pw:${ip}`)
  if (!rl.allowed) {
    const res = NextResponse.json(
      { error: `Слишком много попыток. Попробуй через ${rl.retryAfterSeconds} с.` },
      { status: 429 }
    )
    res.headers.set('Retry-After', String(rl.retryAfterSeconds))
    return res
  }

  const flow = await getAuthFlowCookie()
  if (flow?.kind !== 'signin') {
    return NextResponse.json({ error: 'Сессия шага истекла. Начни с email.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Проверь поля', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const emailLower = parsed.data.email.trim().toLowerCase()
  if (emailLower !== flow.email.toLowerCase()) {
    return NextResponse.json({ error: 'Email не совпадает с шагом входа.' }, { status: 400 })
  }

  try {
    const result = await workOsAuthService.signInWithPassword(req, emailLower, parsed.data.password)
    if (result.outcome === 'needs_email_verification') {
      await setAuthFlowCookie({
        kind: 'signin',
        email: flow.email,
        verificationMode: 'email_verify',
        pendingAuthenticationToken: result.pendingAuthenticationToken
      })
      return NextResponse.json({ ok: true, next: 'email_verify' as const, nextPath: '/login/code' })
    }

    return NextResponse.json({ ok: true, redirectTo: POST_AUTH_REDIRECT_PATH })
  } catch (error: unknown) {
    return NextResponse.json({ error: mapAuthKitErrorToMessage(error) }, { status: 401 })
  }
}
