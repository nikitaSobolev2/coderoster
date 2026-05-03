import { redirect } from 'next/navigation'

import SignupCodeClient from '~/features/authentication/pages/SignupCodeClient'
import { getAuthFlowCookie } from '~/server/auth/authFlowCookie'

export default async function SignupCodePage() {
  const flow = await getAuthFlowCookie()
  if (!flow || flow.kind !== 'signup') {
    redirect('/signup')
  }

  return <SignupCodeClient email={flow.email} />
}
