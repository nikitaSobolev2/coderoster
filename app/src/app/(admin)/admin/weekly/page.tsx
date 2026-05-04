import { api, HydrateClient } from '~/trpc/server'
import { requireBackofficePageRole } from '~/server/auth/requireBackofficeRole'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import WeeklyList from '~/features/admin/challenges/WeeklyList'

export const dynamic = 'force-dynamic'

export default async function AdminWeeklyPage() {
  await requireBackofficePageRole(['admin', 'moderator'])
  await api.admin.challenges.weekly.list.prefetch()
  return (
    <>
      <AdminPageHeader
        title="Спидраны"
        subtitle="Набор задач на ISO-неделю с полноценным редактором — как в курсе."
      />
      <HydrateClient>
        <WeeklyList />
      </HydrateClient>
    </>
  )
}
