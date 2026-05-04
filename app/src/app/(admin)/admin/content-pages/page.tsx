import { api, HydrateClient } from '~/trpc/server'
import { requireBackofficePageRole } from '~/server/auth/requireBackofficeRole'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import ContentPagesTable from '~/features/admin/content-pages/ContentPagesTable'

export const dynamic = 'force-dynamic'

export default async function AdminContentPagesPage() {
  await requireBackofficePageRole(['admin'])
  await api.admin.contentPages.list.prefetch()
  return (
    <>
      <AdminPageHeader
        title="Контент-страницы"
        subtitle="«О проекте», «Карьера», «Контакты» — Markdown-страницы для футера и хедера."
      />
      <HydrateClient>
        <ContentPagesTable />
      </HydrateClient>
    </>
  )
}
