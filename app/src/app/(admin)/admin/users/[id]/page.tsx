import { notFound } from 'next/navigation'
import { api, HydrateClient } from '~/trpc/server'
import { requireBackofficePageRole } from '~/server/auth/requireBackofficeRole'
import { resolveBackofficeViewer } from '~/server/auth/resolveBackofficeViewer'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import ModerationUserDetailTabs from '~/features/admin/users/ModerationUserDetailTabs'
import UserDetailTabs from '~/features/admin/users/UserDetailTabs'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminUserDetailPage({ params }: Props) {
  await requireBackofficePageRole(['admin', 'moderator'])
  const { id } = await params
  const viewer = await resolveBackofficeViewer()

  if (viewer?.role === 'moderator') {
    const user = await api.admin.users.moderationGet({ id }).catch(() => null)
    if (!user) notFound()
    return (
      <>
        <AdminPageHeader
          title={user.displayName}
          subtitle={`@${user.username} · режим модератора (без email и тарифа)`}
        />
        <HydrateClient>
          <ModerationUserDetailTabs initialUser={user} />
        </HydrateClient>
      </>
    )
  }

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
