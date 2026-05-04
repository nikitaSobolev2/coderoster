import { redirect } from 'next/navigation'

import { resolveAdminViewer } from '~/server/auth/resolveAdminViewer'
import AdminShell from '~/shared/components/layouts/AdminShell'

/**
 * Role-gated admin layout. Resolves the WorkOS session, syncs to the local
 * `User` row, and redirects non-admins back to the public landing.
 */
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const viewer = await resolveAdminViewer()
  if (!viewer) redirect('/')
  return <AdminShell viewer={viewer}>{children}</AdminShell>
}
