import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { checkAuthRateLimit } from '~/server/auth/authRateLimit'
import { getAuthFlowCookie, setAuthFlowCookie } from '~/server/auth/authFlowCookie'
import { clientIpFromHeaders } from '~/server/auth/clientIp'
import { mapAuthKitErrorToMessage, workOsAuthService } from '~/server/auth/workOsAuthService'

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers)
  const rl = await checkAuthRateLimit('otp', `magic-send:${ip}`)
  if (!rl.allowed) {
    const res = NextResponse.json(
      {
        error: `Слишком много запросов. Попробуй через ${rl.retryAfterSeconds} с.`,
        retryAfterSeconds: rl.retryAfterSeconds
      },
      { status: 429 }
    )
    res.headers.set('Retry-After', String(rl.retryAfterSeconds))
    return res
  }

  const flow = await getAuthFlowCookie()
  if (flow?.kind !== 'signin') {
    return NextResponse.json({ error: 'Сессия шага истекла. Начни с email.' }, { status: 400 })
  }

  try {
    await setAuthFlowCookie({
      kind: 'signin',
      email: flow.email,
      verificationMode: 'magic',
      pendingAuthenticationToken: undefined
    })
    await workOsAuthService.sendMagicAuth(flow.email)
    return NextResponse.json({ ok: true, nextPath: '/login/code' as const })
  } catch (error: unknown) {
    return NextResponse.json({ error: mapAuthKitErrorToMessage(error) }, { status: 400 })
  }
}
