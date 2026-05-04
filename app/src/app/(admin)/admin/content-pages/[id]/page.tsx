import { notFound } from 'next/navigation'
import { api, HydrateClient } from '~/trpc/server'
import { requireBackofficePageRole } from '~/server/auth/requireBackofficeRole'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import ContentPageEditor from '~/features/admin/content-pages/ContentPageEditor'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminContentPageEditorPage({ params }: Props) {
  await requireBackofficePageRole(['admin'])
  const { id } = await params
  const page = await api.admin.contentPages.get({ id }).catch(() => null)
  if (!page) notFound()
  return (
    <>
      <AdminPageHeader title={page.title} subtitle={`/p/${page.slug}`} />
      <HydrateClient>
        <ContentPageEditor page={page} />
      </HydrateClient>
    </>
  )
}
