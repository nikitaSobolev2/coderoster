import 'server-only'

import { env } from '~/env'

/** Matches env `ADMIN_BOOTSTRAP_EMAIL` (case-insensitive). False when unset. */
export function isBootstrapAdminEmail(email: string): boolean {
  const target = env.ADMIN_BOOTSTRAP_EMAIL?.toLowerCase()
  if (!target) return false
  return email.toLowerCase() === target
}
