import { handleAuth } from '@workos-inc/authkit-nextjs'

/**
 * Forward authenticated learners straight into the platform catalog so the
 * post-login experience surfaces course content first instead of the
 * marketing landing page.
 */
export const GET = handleAuth({ returnPathname: '/courses' })
