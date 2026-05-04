import { api, HydrateClient } from '~/trpc/server'
import { requireBackofficePageRole } from '~/server/auth/requireBackofficeRole'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import CommentsModeration from '~/features/admin/moderation/CommentsModeration'

export const dynamic = 'force-dynamic'

export default async function AdminCommentsPage() {
  await requireBackofficePageRole(['admin', 'moderator'])
  await api.admin.comments.list.prefetch({})
  return (
    <>
      <AdminPageHeader
        title="Комментарии"
        subtitle="Глобальная модерация. Любой комментарий на платформе можно удалить из этой таблицы."
      />
      <HydrateClient>
        <CommentsModeration />
      </HydrateClient>
    </>
  )
}
