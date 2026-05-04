import PlansAdminPanel from '~/features/admin/plans/PlansAdminPanel'
import { requireBackofficePageRole } from '~/server/auth/requireBackofficeRole'
import { pageTitle } from '~/shared/constants/site'

export const metadata = { title: pageTitle('Тарифы') }

export default async function AdminPlansPage() {
  await requireBackofficePageRole(['admin'])
  return <PlansAdminPanel />
}
