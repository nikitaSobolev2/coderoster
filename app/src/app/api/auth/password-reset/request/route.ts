import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { emailSchema } from '~/features/authentication/validation/schemas'
import { checkAuthRateLimit } from '~/server/auth/authRateLimit'
import { clientIpFromHeaders } from '~/server/auth/clientIp'
import { mapAuthKitErrorToMessage, workOsAuthService } from '~/server/auth/workOsAuthService'

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers)
  const rl = await checkAuthRateLimit('email', `pw-reset:${ip}`)
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

  try {
    await workOsAuthService.requestPasswordReset(parsed.data.email.toLowerCase())
    /** Avoid email enumeration — always generic success */
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    /** Still generic — WorkOS may reject unknown emails internally */
    void mapAuthKitErrorToMessage(error)
    return NextResponse.json({ ok: true })
  }
}
