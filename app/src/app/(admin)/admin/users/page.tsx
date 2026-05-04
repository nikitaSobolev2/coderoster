import { Suspense } from 'react'
import { api, HydrateClient } from '~/trpc/server'
import { requireBackofficePageRole } from '~/server/auth/requireBackofficeRole'
import { resolveBackofficeViewer } from '~/server/auth/resolveBackofficeViewer'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import UsersTable from '~/features/admin/users/UsersTable'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  await requireBackofficePageRole(['admin', 'moderator'])
  const viewer = await resolveBackofficeViewer()
  if (viewer?.role === 'moderator') {
    await api.admin.users.moderationList.prefetch({})
  } else {
    await api.admin.users.list.prefetch({})
  }
  return (
    <>
      <AdminPageHeader
        title="Пользователи"
        subtitle={
          viewer?.role === 'moderator'
            ? 'Модерация: поиск по нику и имени, мьют чата, комментарии. Без email и смены ролей.'
            : 'Поиск, бан, роли, активность и комментарии. Идемпотентные действия пишутся в аудит.'
        }
      />
      <HydrateClient>
        <Suspense>
          <UsersTable />
        </Suspense>
      </HydrateClient>
    </>
  )
}
