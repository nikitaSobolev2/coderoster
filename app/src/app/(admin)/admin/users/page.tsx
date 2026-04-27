import { Suspense } from 'react'
import { api, HydrateClient } from '~/trpc/server'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import UsersTable from '~/features/admin/users/UsersTable'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  await api.admin.users.list.prefetch({})
  return (
    <>
      <AdminPageHeader
        title="Пользователи"
        subtitle="Поиск, бан, роли, активность и комментарии. Идемпотентные действия пишутся в аудит."
      />
      <HydrateClient>
        <Suspense>
          <UsersTable />
        </Suspense>
      </HydrateClient>
    </>
  )
}
