import { api, HydrateClient } from '~/trpc/server'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import CommentsModeration from '~/features/admin/moderation/CommentsModeration'

export const dynamic = 'force-dynamic'

export default async function AdminCommentsPage() {
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
