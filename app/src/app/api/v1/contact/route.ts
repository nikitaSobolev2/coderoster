import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { contactPayloadSchema } from '~/features/contact/contactPayloadSchema'
import { clientIpFromHeaders } from '~/server/auth/clientIp'
import { checkContactFormRateLimit } from '~/server/contact/contactRateLimit'
import { persistContactMessage } from '~/server/contact/persistContactMessage'

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers)
  const rl = await checkContactFormRateLimit(`contact:${ip}`)
  if (!rl.allowed) {
    const res = NextResponse.json(
      {
        ok: false as const,
        error: `Слишком много сообщений. Попробуй через ${rl.retryAfterSeconds} с.`
      },
      { status: 429 }
    )
    res.headers.set('Retry-After', String(rl.retryAfterSeconds))
    return res
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false as const, error: 'Некорректный JSON' }, { status: 400 })
  }

  const parsed = contactPayloadSchema.safeParse(body)
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.message?.[0] ??
      parsed.error.flatten().fieldErrors.email?.[0] ??
      parsed.error.flatten().fieldErrors.name?.[0] ??
      'Проверь поля формы'
    return NextResponse.json({ ok: false as const, error: msg }, { status: 400 })
  }

  try {
    await persistContactMessage(parsed.data)
    return NextResponse.json({ ok: true as const })
  } catch {
    return NextResponse.json({ ok: false as const, error: 'Не удалось сохранить сообщение.' }, { status: 502 })
  }
}
