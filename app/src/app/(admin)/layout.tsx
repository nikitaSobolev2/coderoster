import { redirect } from 'next/navigation'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { env } from '~/env'
import { isTruthyFlag } from '~/server/lib/featureFlags'
import { userSyncService } from '~/server/services/UserSyncService'
import AdminShell from '~/shared/components/layouts/AdminShell'
import type { AdminViewer } from '~/shared/components/layouts/AdminShell/AdminTopbar'

/**
 * Role-gated admin layout. Resolves the WorkOS session, syncs to the local
 * `User` row, and redirects non-admins back to the public landing.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await resolveAdminViewer()
  if (!viewer) redirect('/')
  return <AdminShell viewer={viewer}>{children}</AdminShell>
}

async function resolveAdminViewer(): Promise<AdminViewer | null> {
  const session = await withAuth()
  if (!session.user) return null
  if (isTruthyFlag(env.USE_FAKE_DATA)) return null

  const local = await userSyncService.syncFromSession({
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName ?? null,
    lastName: session.user.lastName ?? null,
    profilePictureUrl: session.user.profilePictureUrl ?? null
  })
  if (local.role !== 'ADMIN') return null
  return {
    username: local.username,
    displayName: local.displayName,
    avatarUrl: local.avatarUrl
  }
}
