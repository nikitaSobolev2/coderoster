import { notFound } from 'next/navigation'
import { api, HydrateClient } from '~/trpc/server'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import UserDetailTabs from '~/features/admin/users/UserDetailTabs'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params
  const user = await api.admin.users.get({ id }).catch(() => null)
  if (!user) notFound()
  await api.admin.achievements.list.prefetch()
  const planSubtitle = user.plan
    ? `Тариф: ${user.plan.name} (tier ${user.plan.tierLevel}, ${user.plan.slug})`
    : 'Тариф не назначен'
  return (
    <>
      <AdminPageHeader
        title={user.displayName}
        subtitle={`@${user.username} · ${user.email} · ${planSubtitle}`}
      />
      <HydrateClient>
        <UserDetailTabs initialUser={user} />
      </HydrateClient>
    </>
  )
}
