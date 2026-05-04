import { api, HydrateClient } from '~/trpc/server'
import { requireBackofficePageRole } from '~/server/auth/requireBackofficeRole'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import AuditTable from '~/features/admin/audit/AuditTable'

export const dynamic = 'force-dynamic'

export default async function AdminAuditPage() {
  await requireBackofficePageRole(['admin'])
  await api.admin.audit.list.prefetch({})
  return (
    <>
      <AdminPageHeader
        title="Аудит"
        subtitle="Append-only журнал. Любая мутация под adminProcedure пишет сюда строку."
      />
      <HydrateClient>
        <AuditTable />
      </HydrateClient>
    </>
  )
}
