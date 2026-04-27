import { notFound } from 'next/navigation'
import { api, HydrateClient } from '~/trpc/server'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import CourseEditorShell from '~/features/admin/course-editor/CourseEditorShell'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminCourseEditorPage({ params }: Props) {
  const { id } = await params
  const [tree, languages, categories] = await Promise.all([
    api.admin.courseEditor.get({ courseId: id }).catch(() => null),
    api.admin.languages.list(),
    api.admin.catalog.categories.list()
  ])
  if (!tree) notFound()
  return (
    <>
      <AdminPageHeader
        title={tree.title || 'Без названия'}
        subtitle={`Редактор курса · ${tree.modules.length} модулей · ${tree.modules.reduce(
          (total, module) => total + module.tasks.length,
          0
        )} задач`}
      />
      <HydrateClient>
        <CourseEditorShell
          initialTree={tree}
          languageOptions={languages}
          categoryOptions={categories.map(category => ({
            value: category.id,
            label: category.title
          }))}
        />
      </HydrateClient>
    </>
  )
}
