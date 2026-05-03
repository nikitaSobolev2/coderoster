import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { POST_AUTH_REDIRECT_PATH } from '~/features/authentication/constants'
import { signupCompletePasswordSchema } from '~/features/authentication/validation/schemas'
import { checkAuthRateLimit } from '~/server/auth/authRateLimit'
import { clearAuthFlowCookie, getAuthFlowCookie } from '~/server/auth/authFlowCookie'
import { clientIpFromHeaders } from '~/server/auth/clientIp'
import { mapAuthKitErrorToMessage, workOsAuthService } from '~/server/auth/workOsAuthService'
import { consentAtFromSignupFlowCookie } from '~/server/auth/signupFlowConsent'
import { userSyncService } from '~/server/services/UserSyncService'

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers)
  const rl = await checkAuthRateLimit('signup', `signup-pw:${ip}`)
  if (!rl.allowed) {
    const res = NextResponse.json(
      { error: `Слишком много попыток. Попробуй через ${rl.retryAfterSeconds} с.` },
      { status: 429 }
    )
    res.headers.set('Retry-After', String(rl.retryAfterSeconds))
    return res
  }

  const flow = await getAuthFlowCookie()
  if (!flow || flow.kind !== 'signup') {
    return NextResponse.json(
      { error: 'Сессия регистрации истекла. Заполни профиль снова.' },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный JSON' }, { status: 400 })
  }

  const parsed = signupCompletePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Проверь поля', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const emailLower = parsed.data.email.trim().toLowerCase()
  if (emailLower !== flow.email.toLowerCase()) {
    return NextResponse.json({ error: 'Email не совпадает с шагом регистрации.' }, { status: 400 })
  }

  const consentAtOrError = consentAtFromSignupFlowCookie(flow)
  if (consentAtOrError instanceof NextResponse) return consentAtOrError

  try {
    const snapshot = await workOsAuthService.completeSignupWithPassword(req, {
      email: emailLower,
      password: parsed.data.password,
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim()
    })
    await userSyncService.syncFromSession(snapshot, {
      personalDataProcessingConsentAt: consentAtOrError
    })
    await clearAuthFlowCookie()
    return NextResponse.json({ ok: true, redirectTo: POST_AUTH_REDIRECT_PATH })
  } catch (error: unknown) {
    const msg = mapAuthKitErrorToMessage(error)
    const status = msg.toLowerCase().includes('already') || msg.includes('уже') ? 409 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}
