import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { passwordResetCompleteSchema } from '~/features/authentication/validation/schemas'
import { checkAuthRateLimit } from '~/server/auth/authRateLimit'
import { clientIpFromHeaders } from '~/server/auth/clientIp'
import { mapAuthKitErrorToMessage, workOsAuthService } from '~/server/auth/workOsAuthService'

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers)
  const rl = await checkAuthRateLimit('password', `pw-reset-done:${ip}`)
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

  const parsed = passwordResetCompleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Проверь пароль и ссылку', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    await workOsAuthService.resetPassword(parsed.data.token, parsed.data.newPassword)
    return NextResponse.json({ ok: true, nextPath: '/login' as const })
  } catch (error: unknown) {
    return NextResponse.json({ error: mapAuthKitErrorToMessage(error) }, { status: 400 })
  }
}
