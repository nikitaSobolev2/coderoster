import { handleAuth } from '@workos-inc/authkit-nextjs'
import { canonicalPublicOrigin } from '~/lib/requestOrigin'

/**
 * Forward authenticated learners straight into the platform catalog so the
 * post-login experience surfaces course content first instead of the
 * marketing landing page.
 *
 * Pass `baseURL` so redirects use the configured public origin, not Next's inbound URL (often
 * localhost inside docker).
 */
export const GET = handleAuth({
  baseURL: canonicalPublicOrigin(),
  returnPathname: '/courses'
})
