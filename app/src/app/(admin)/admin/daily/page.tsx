import { api, HydrateClient } from '~/trpc/server'
import { requireBackofficePageRole } from '~/server/auth/requireBackofficeRole'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import DailyList from '~/features/admin/challenges/DailyList'

export const dynamic = 'force-dynamic'

export default async function AdminDailyPage() {
  await requireBackofficePageRole(['admin', 'moderator'])
  await api.admin.challenges.daily.list.prefetch()
  return (
    <>
      <AdminPageHeader
        title="Дейлики"
        subtitle="Каждый дейлик — отдельный набор задач, который ты собираешь полностью здесь, как в курсе."
      />
      <HydrateClient>
        <DailyList />
      </HydrateClient>
    </>
  )
}
