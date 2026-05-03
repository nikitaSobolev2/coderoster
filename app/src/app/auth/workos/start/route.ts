import { getSignInUrl, getSignUpUrl } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

import { withForcedLoginPrompt } from '~/features/authentication/lib/withForcedLoginPrompt'

/**
 * WorkOS dashboard **Sign-in endpoint** should point here (not `/login`).
 * Sets PKCE verifier cookie via AuthKit helpers, then redirects to hosted AuthKit / IdP.
 *
 * Query: `screen=sign-up` uses hosted sign-up hint (Enterprise / flows that need it).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const screen = url.searchParams.get('screen')
  const targetUrl =
    screen === 'sign-up' ? await getSignUpUrl({ loginHint: url.searchParams.get('login_hint') ?? undefined }) : await getSignInUrl({ loginHint: url.searchParams.get('login_hint') ?? undefined })

  redirect(withForcedLoginPrompt(targetUrl))
}
