import { redirect } from 'next/navigation'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { env } from '~/env'
import { isTruthyFlag } from '~/server/lib/featureFlags'
import {
  clearSignupAuthFlowCookie,
  resolvePendingSignupConsentOptions
} from '~/server/auth/pendingSignupConsentSync'
import { normalizeWorkosSessionEmail } from '~/server/auth/workosSessionEmail'
import { userSyncService } from '~/server/services/UserSyncService'

export const dynamic = 'force-dynamic'

/**
 * Resolves the canonical username for the current session and forwards to
 * `/u/<username>`. Centralising this avoids dead links after rename and
 * eliminates the previous 404 that came from stale email-prefix derivation.
 */
export default async function MyProfileRedirect() {
  const session = await withAuth()
  if (!session.user) redirect('/login')

  if (isTruthyFlag(env.USE_FAKE_DATA)) {
    const email = normalizeWorkosSessionEmail(session.user.email) ?? 'me@local'
    const username = email.split('@')[0] ?? 'me'
    redirect(`/u/${username}`)
  }

  const sessionEmail = normalizeWorkosSessionEmail(session.user.email)
  if (!sessionEmail) redirect('/login')

  const consentOpts = await resolvePendingSignupConsentOptions(sessionEmail)
  const user = await userSyncService.syncFromSession(
    {
      id: session.user.id,
      email: sessionEmail,
      firstName: session.user.firstName ?? null,
      lastName: session.user.lastName ?? null,
      profilePictureUrl: session.user.profilePictureUrl ?? null
    },
    consentOpts
  )
  if (consentOpts) await clearSignupAuthFlowCookie()
  redirect(`/u/${user.username}`)
}
