import { HydrateClient, api } from '~/trpc/server'
import PlansMarketingPage from '~/features/platform/plans/PlansMarketingPage'
import { pageTitle } from '~/shared/constants/site'

export const metadata = { title: pageTitle('Тарифы') }

export default async function PlansPage() {
  await Promise.all([api.plan.list.prefetch(), api.plan.policies.prefetch()])

  return (
    <HydrateClient>
      <PlansMarketingPage />
    </HydrateClient>
  )
}
