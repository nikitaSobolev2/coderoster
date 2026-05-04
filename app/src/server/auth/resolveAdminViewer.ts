import 'server-only'

import { withAuth } from '@workos-inc/authkit-nextjs'

import { env } from '~/env'
import {
  clearSignupAuthFlowCookie,
  resolvePendingSignupConsentOptions
} from '~/server/auth/pendingSignupConsentSync'
import { normalizeWorkosSessionEmail } from '~/server/auth/workosSessionEmail'
import { isTruthyFlag } from '~/server/lib/featureFlags'
import { userSyncService } from '~/server/services/UserSyncService'
import type { AdminViewer } from '~/shared/components/layouts/AdminShell/AdminTopbar'

/**
 * Loads WorkOS session, syncs to local DB, validates admin gate. Caller owns redirect/UI.
 */
export async function resolveAdminViewer(): Promise<AdminViewer | null> {
  const session = await withAuth()
  const workosUser = session.user
  if (!workosUser) return null
  const sessionEmail = normalizeWorkosSessionEmail(workosUser.email)
  if (!sessionEmail) return null
  if (isTruthyFlag(env.USE_FAKE_DATA)) return null

  const consentOpts = await resolvePendingSignupConsentOptions(sessionEmail)
  const local = await userSyncService.syncFromSession(
    {
      id: workosUser.id,
      email: sessionEmail,
      firstName: workosUser.firstName ?? null,
      lastName: workosUser.lastName ?? null,
      profilePictureUrl: workosUser.profilePictureUrl ?? null
    },
    consentOpts
  )
  if (consentOpts) await clearSignupAuthFlowCookie()
  if (local.role !== 'ADMIN') return null
  return {
    username: local.username,
    displayName: local.displayName,
    avatarUrl: local.avatarUrl
  }
}
