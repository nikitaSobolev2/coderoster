import { notFound } from 'next/navigation'
import { api, HydrateClient } from '~/trpc/server'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import WeeklyChallengeEditor from '~/features/admin/challenges/WeeklyChallengeEditor'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminWeeklyEditorPage({ params }: Props) {
  const { id } = await params
  const [detail, languages] = await Promise.all([
    api.admin.challenges.weekly.get({ id }).catch(() => null),
    api.admin.languages.list()
  ])
  if (!detail) notFound()
  return (
    <>
      <AdminPageHeader
        title={`Спидран ${detail.isoWeek}`}
        subtitle={`${detail.tasks.length} задач · полный редактор с тестами`}
      />
      <HydrateClient>
        <WeeklyChallengeEditor initial={detail} languageOptions={languages} />
      </HydrateClient>
    </>
  )
}
