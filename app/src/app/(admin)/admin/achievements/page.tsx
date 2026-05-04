import { api, HydrateClient } from '~/trpc/server'
import { requireBackofficePageRole } from '~/server/auth/requireBackofficeRole'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import AchievementsPanel from '~/features/admin/achievements/AchievementsPanel'

export const dynamic = 'force-dynamic'

export default async function AdminAchievementsPage() {
  await requireBackofficePageRole(['admin'])
  await api.admin.achievements.list.prefetch()
  return (
    <>
      <AdminPageHeader
        title="Достижения"
        subtitle="Каталог. Конкретные триггеры и условия живут в AchievementService — здесь только описания."
      />
      <HydrateClient>
        <AchievementsPanel />
      </HydrateClient>
    </>
  )
}
