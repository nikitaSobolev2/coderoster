import { api, HydrateClient } from '~/trpc/server'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import CategoriesPanel from '~/features/admin/catalog/CategoriesPanel'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  await api.admin.catalog.categories.list.prefetch()
  return (
    <>
      <AdminPageHeader
        title="Категории"
        subtitle="Группируют курсы в каталоге. Поддерживают вложенность через родителя."
      />
      <HydrateClient>
        <CategoriesPanel />
      </HydrateClient>
    </>
  )
}
