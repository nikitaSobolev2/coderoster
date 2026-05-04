import { redirect } from 'next/navigation'

import SignupPasswordClient from '~/features/authentication/pages/SignupPasswordClient'
import { getAuthFlowCookie } from '~/server/auth/authFlowCookie'

export default async function SignupPasswordPage() {
  const flow = await getAuthFlowCookie()
  if (flow?.kind !== 'signup') {
    redirect('/signup')
  }

  return (
    <SignupPasswordClient email={flow.email} firstName={flow.firstName} lastName={flow.lastName} />
  )
}
