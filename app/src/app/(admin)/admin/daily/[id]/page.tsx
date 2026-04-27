import { notFound } from 'next/navigation'
import { api, HydrateClient } from '~/trpc/server'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import DailyChallengeEditor from '~/features/admin/challenges/DailyChallengeEditor'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminDailyEditorPage({ params }: Props) {
  const { id } = await params
  const [detail, languages] = await Promise.all([
    api.admin.challenges.daily.get({ id }).catch(() => null),
    api.admin.languages.list()
  ])
  if (!detail) notFound()
  return (
    <>
      <AdminPageHeader
        title={`Дейлик ${detail.date}`}
        subtitle={`${detail.tasks.length} задач · полный редактор с тестами`}
      />
      <HydrateClient>
        <DailyChallengeEditor initial={detail} languageOptions={languages} />
      </HydrateClient>
    </>
  )
}
