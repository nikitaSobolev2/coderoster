import { redirect } from 'next/navigation'

import LoginPasswordClient from '~/features/authentication/pages/LoginPasswordClient'
import { getAuthFlowCookie } from '~/server/auth/authFlowCookie'

export default async function LoginPasswordPage() {
  const flow = await getAuthFlowCookie()
  if (!flow || flow.kind !== 'signin') {
    redirect('/login')
  }

  return <LoginPasswordClient email={flow.email} />
}
