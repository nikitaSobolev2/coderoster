import { randomBytes } from 'crypto'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { signGuestSessionToken, verifyGuestSessionToken } from '~/server/livechat/guestSession'

export const runtime = 'nodejs'

export async function POST() {
  const jar = await cookies()
  const existing = jar.get('livechat_guest')?.value
  if (existing && verifyGuestSessionToken(existing)) {
    return NextResponse.json({ ok: true as const })
  }

  const sessionId = randomBytes(16).toString('hex')
  const token = signGuestSessionToken(sessionId)
  jar.set('livechat_guest', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  })
  return NextResponse.json({ ok: true as const })
}
