import { api, HydrateClient } from '~/trpc/server'
import { requireBackofficePageRole } from '~/server/auth/requireBackofficeRole'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import LanguagesPanel from '~/features/admin/system/LanguagesPanel'

export const dynamic = 'force-dynamic'

export default async function AdminLanguagesPage() {
  await requireBackofficePageRole(['admin', 'author'])
  await api.admin.languages.list.prefetch()
  return (
    <>
      <AdminPageHeader
        title="Разрешённые языки"
        subtitle="Глобальный набор. Используется в выборе языков на уровне задачи и в исполнителе."
      />
      <HydrateClient>
        <LanguagesPanel />
      </HydrateClient>
    </>
  )
}
