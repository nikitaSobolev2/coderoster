import 'server-only'

import { RateLimiter } from '~/server/rateLimit'

const CONTACT_FORM_BUCKET = new RateLimiter('contact_form', 12, 3600)

export async function checkContactFormRateLimit(
  identity: string
): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }> {
  const result = await CONTACT_FORM_BUCKET.check(identity)
  if (!result.allowed) {
    return { allowed: false, retryAfterSeconds: result.retryAfterSeconds }
  }
  return { allowed: true }
}
