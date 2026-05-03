import SignupProfileClient from '~/features/authentication/pages/SignupProfileClient'
import { getAuthFlowCookie } from '~/server/auth/authFlowCookie'

export default async function SignupPage() {
  const flow = await getAuthFlowCookie()
  const initialEmail = flow?.kind === 'signup_hint' ? flow.email : ''

  return <SignupProfileClient initialEmail={initialEmail} />
}
