import { api, HydrateClient } from '~/trpc/server'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import LeaderboardPanel from '~/features/admin/moderation/LeaderboardPanel'

export const dynamic = 'force-dynamic'

export default async function AdminLeaderboardPage() {
  await api.admin.leaderboard.list.prefetch()
  return (
    <>
      <AdminPageHeader
        title="Лидерборд"
        subtitle="Можно убирать пользователей из таблицы рейтинга — например, тестовые аккаунты или нарушителей."
      />
      <HydrateClient>
        <LeaderboardPanel />
      </HydrateClient>
    </>
  )
}
