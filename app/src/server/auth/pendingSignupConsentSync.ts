import 'server-only'

import type { UserSyncOptions } from '~/server/services/UserSyncService'

import { clearAuthFlowCookie, getAuthFlowCookie } from './authFlowCookie'

/**
 * After hosted OAuth/sign-up, WorkOS redirects back before `/api/auth/signup/*` runs.
 * If sealed signup cookie matches session email, apply consent on first local sync then drop cookie.
 */
export async function pendingSignupConsentForSync(
  sessionEmail: string
): Promise<UserSyncOptions | undefined> {
  const flow = await getAuthFlowCookie()
  if (flow?.kind !== 'signup' || !flow.personalDataProcessingConsentAt) return undefined
  if (flow.email.toLowerCase() !== sessionEmail.trim().toLowerCase()) return undefined
  const consentAt = new Date(flow.personalDataProcessingConsentAt)
  if (Number.isNaN(consentAt.getTime())) return undefined
  return { personalDataProcessingConsentAt: consentAt }
}

export async function clearSignupAuthFlowCookie(): Promise<void> {
  const flow = await getAuthFlowCookie()
  if (flow?.kind === 'signup') await clearAuthFlowCookie()
}
