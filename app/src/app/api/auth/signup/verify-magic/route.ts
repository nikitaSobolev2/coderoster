import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { POST_AUTH_REDIRECT_PATH } from '~/features/authentication/constants'
import { otpSchema } from '~/features/authentication/validation/schemas'
import { checkAuthRateLimit } from '~/server/auth/authRateLimit'
import { clearAuthFlowCookie, getAuthFlowCookie } from '~/server/auth/authFlowCookie'
import { clientIpFromHeaders } from '~/server/auth/clientIp'
import { mapAuthKitErrorToMessage, workOsAuthService } from '~/server/auth/workOsAuthService'
import { consentAtFromSignupFlowCookie } from '~/server/auth/signupFlowConsent'
import { userSyncService } from '~/server/services/UserSyncService'

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers)
  const rl = await checkAuthRateLimit('otp', `signup-magic-verify:${ip}`)
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
    return NextResponse.json({ error: 'Сессия регистрации истекла.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный JSON' }, { status: 400 })
  }

  const parsed = otpSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.code?.[0] ?? 'Нужен код из 6 цифр'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const consentAtOrError = consentAtFromSignupFlowCookie(flow)
  if (consentAtOrError instanceof NextResponse) return consentAtOrError

  try {
    const snapshot = await workOsAuthService.verifySignupMagic(req, flow.email, parsed.data.code)
    await userSyncService.syncFromSession(snapshot, {
      personalDataProcessingConsentAt: consentAtOrError
    })
    await clearAuthFlowCookie()
    return NextResponse.json({ ok: true, redirectTo: POST_AUTH_REDIRECT_PATH })
  } catch (error: unknown) {
    return NextResponse.json({ error: mapAuthKitErrorToMessage(error) }, { status: 401 })
  }
}
