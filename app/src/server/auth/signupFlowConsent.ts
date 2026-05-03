import { NextResponse } from 'next/server'

/**
 * Signup flow cookie must carry consent timestamp from POST /api/auth/signup/profile.
 */
export function consentAtFromSignupFlowCookie(flow: {
  personalDataProcessingConsentAt?: string
}): Date | NextResponse {
  const raw = flow.personalDataProcessingConsentAt
  if (!raw) {
    return NextResponse.json(
      { error: 'Сессия регистрации без согласия на обработку данных. Заполни профиль снова.' },
      { status: 400 }
    )
  }
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return NextResponse.json({ error: 'Некорректная сессия регистрации.' }, { status: 400 })
  }
  return parsed
}
