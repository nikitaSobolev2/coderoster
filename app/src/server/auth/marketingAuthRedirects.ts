import { redirect } from 'next/navigation'
import { withAuth } from '@workos-inc/authkit-nextjs'

import { POST_AUTH_REDIRECT_PATH } from '~/features/authentication/constants'

/** `/login`, `/signup`, recovery flows — signed-in visitors go to catalog. */
export async function redirectSignedInUserFromMarketingAuthRoutes(): Promise<void> {
  const session = await withAuth({ ensureSignedIn: false })
  if (session.user) redirect(POST_AUTH_REDIRECT_PATH)
}
