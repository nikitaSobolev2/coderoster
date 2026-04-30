import PlansAdminPanel from '~/features/admin/plans/PlansAdminPanel'
import { pageTitle } from '~/shared/constants/site'

export const metadata = { title: pageTitle('Тарифы') }

export default function AdminPlansPage() {
  return <PlansAdminPanel />
}
