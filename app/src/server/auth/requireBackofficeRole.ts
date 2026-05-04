import 'server-only'

import { redirect } from 'next/navigation'

import type { BackofficeRole } from '~/shared/types/backoffice'

import type { BackofficeShellViewer } from '~/shared/components/layouts/AdminShell/AdminTopbar'

import { resolveBackofficeViewer } from './resolveBackofficeViewer'

/**
 * Server Component guard: redirect to `/admin` when the actor lacks one of
 * the allowed backoffice roles.
 */
export async function requireBackofficePageRole(
  allowed: BackofficeRole[]
): Promise<BackofficeShellViewer> {
  const viewer = await resolveBackofficeViewer()
  if (!viewer) redirect('/')
  if (!allowed.includes(viewer.role)) {
    if (viewer.role === 'author') redirect('/admin/courses')
    if (viewer.role === 'moderator') redirect('/admin/users')
    redirect('/admin')
  }
  return viewer
}
