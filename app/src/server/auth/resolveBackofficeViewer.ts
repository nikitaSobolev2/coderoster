import 'server-only'

import { type Role } from '@prisma/client'
import { withAuth } from '@workos-inc/authkit-nextjs'

import { env } from '~/env'
import {
  clearSignupAuthFlowCookie,
  resolvePendingSignupConsentOptions
} from '~/server/auth/pendingSignupConsentSync'
import { normalizeWorkosSessionEmail } from '~/server/auth/workosSessionEmail'
import { isTruthyFlag } from '~/server/lib/featureFlags'
import { userSyncService } from '~/server/services/UserSyncService'
import type { BackofficeShellViewer } from '~/shared/components/layouts/AdminShell/AdminTopbar'
import type { BackofficeRole } from '~/shared/types/backoffice'

const STAFF_PRISMA_ROLES: Role[] = ['ADMIN', 'MODERATOR', 'AUTHOR']

function prismaRoleToBackoffice(role: Role): BackofficeRole | null {
  switch (role) {
    case 'ADMIN':
      return 'admin'
    case 'MODERATOR':
      return 'moderator'
    case 'AUTHOR':
      return 'author'
    default:
      return null
  }
}

/**
 * WorkOS session → local `User` row → gate for `(admin)` layout (ADMIN, MODERATOR, AUTHOR).
 */
export async function resolveBackofficeViewer(): Promise<BackofficeShellViewer | null> {
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
  if (!STAFF_PRISMA_ROLES.includes(local.role)) return null
  const role = prismaRoleToBackoffice(local.role)
  if (!role) return null
  return {
    username: local.username,
    displayName: local.displayName,
    avatarUrl: local.avatarUrl,
    role
  }
}
