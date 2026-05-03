import 'server-only'

import { RateLimiter } from '~/server/rateLimit'

const EMAIL_BUCKET = new RateLimiter('auth_email', 30, 60)
const PASSWORD_BUCKET = new RateLimiter('auth_password', 20, 60)
const OTP_BUCKET = new RateLimiter('auth_otp', 25, 60)
const SIGNUP_BUCKET = new RateLimiter('auth_signup', 15, 300)

export type AuthRateLimitKind = 'email' | 'password' | 'otp' | 'signup'

export async function checkAuthRateLimit(
  kind: AuthRateLimitKind,
  identity: string
): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }> {
  const bucket =
    kind === 'email'
      ? EMAIL_BUCKET
      : kind === 'password'
        ? PASSWORD_BUCKET
        : kind === 'otp'
          ? OTP_BUCKET
          : SIGNUP_BUCKET

  const result = await bucket.check(identity)
  if (!result.allowed) {
    return { allowed: false, retryAfterSeconds: result.retryAfterSeconds }
  }
  return { allowed: true }
}
