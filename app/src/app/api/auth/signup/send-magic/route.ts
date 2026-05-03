import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { checkAuthRateLimit } from '~/server/auth/authRateLimit'
import { getAuthFlowCookie } from '~/server/auth/authFlowCookie'
import { clientIpFromHeaders } from '~/server/auth/clientIp'
import { mapAuthKitErrorToMessage, workOsAuthService } from '~/server/auth/workOsAuthService'

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers)
  const rl = await checkAuthRateLimit('signup', `signup-magic-send:${ip}`)
  if (!rl.allowed) {
    const res = NextResponse.json(
      {
        error: `Слишком много попыток. Попробуй через ${rl.retryAfterSeconds} с.`,
        retryAfterSeconds: rl.retryAfterSeconds
      },
      { status: 429 }
    )
    res.headers.set('Retry-After', String(rl.retryAfterSeconds))
    return res
  }

  const flow = await getAuthFlowCookie()
  if (flow?.kind !== 'signup') {
    return NextResponse.json(
      { error: 'Сессия регистрации истекла. Заполни профиль снова.' },
      { status: 400 }
    )
  }

  try {
    await workOsAuthService.prepareSignupWithMagic({
      email: flow.email,
      firstName: flow.firstName,
      lastName: flow.lastName
    })
    return NextResponse.json({ ok: true, nextPath: '/signup/code' as const })
  } catch (error: unknown) {
    const msg = mapAuthKitErrorToMessage(error)
    const conflict =
      msg.toLowerCase().includes('already') ||
      msg.toLowerCase().includes('exist') ||
      msg.includes('409')
    if (conflict) {
      return NextResponse.json(
        { error: 'Этот email уже зарегистрирован — войди или используй другой адрес.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
