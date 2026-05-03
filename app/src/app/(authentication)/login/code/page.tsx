import { redirect } from 'next/navigation'

import LoginCodeClient from '~/features/authentication/pages/LoginCodeClient'
import { getAuthFlowCookie } from '~/server/auth/authFlowCookie'

export default async function LoginCodePage() {
  const flow = await getAuthFlowCookie()
  if (!flow || flow.kind !== 'signin' || !flow.verificationMode) {
    redirect('/login')
  }

  return <LoginCodeClient email={flow.email} mode={flow.verificationMode} />
}
