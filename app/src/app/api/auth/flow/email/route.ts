import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { emailSchema } from '~/features/authentication/validation/schemas'
import { checkAuthRateLimit } from '~/server/auth/authRateLimit'
import { clearAuthFlowCookie, setAuthFlowCookie } from '~/server/auth/authFlowCookie'
import { clientIpFromHeaders } from '~/server/auth/clientIp'
import { mapAuthKitErrorToMessage, workOsAuthService } from '~/server/auth/workOsAuthService'

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers)
  const rl = await checkAuthRateLimit('email', `flow-email:${ip}`)
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

  const parsed = emailSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.email?.[0] ?? 'Проверь email'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase()

  try {
    const exists = await workOsAuthService.userExistsWithEmail(email)
    await clearAuthFlowCookie()

    if (exists) {
      await setAuthFlowCookie({
        kind: 'signin',
        email
      })
      return NextResponse.json({ exists: true, nextPath: '/login/password' as const })
    }

    await setAuthFlowCookie({ kind: 'signup_hint', email })
    return NextResponse.json({
      exists: false,
      nextPath: '/signup' as const
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: mapAuthKitErrorToMessage(error) }, { status: 502 })
  }
}
