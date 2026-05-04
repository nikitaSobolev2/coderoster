import { redirect } from 'next/navigation'

import { resolveBackofficeViewer } from '~/server/auth/resolveBackofficeViewer'
import AdminShell from '~/shared/components/layouts/AdminShell'

/**
 * Role-gated back-office layout. Resolves WorkOS session, syncs local `User`,
 * allows ADMIN / MODERATOR / AUTHOR per-route tRPC gates.
 */
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const viewer = await resolveBackofficeViewer()
  if (!viewer) redirect('/')
  return <AdminShell viewer={viewer}>{children}</AdminShell>
}
