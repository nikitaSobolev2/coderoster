import { api, HydrateClient } from '~/trpc/server'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import CoursesTable from '~/features/admin/catalog/CoursesTable'

export const dynamic = 'force-dynamic'

export default async function AdminCoursesPage() {
  await api.admin.catalog.courses.list.prefetch({})
  return (
    <>
      <AdminPageHeader
        title="Курсы"
        subtitle="Создание, статус, порядок и переход в редактор содержимого."
      />
      <HydrateClient>
        <CoursesTable />
      </HydrateClient>
    </>
  )
}
