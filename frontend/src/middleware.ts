import { authkitMiddleware } from '@workos-inc/authkit-nextjs'

/**
 * Auth strategy:
 *  - Public-read routes (`/`, `/courses/*`, `/u/*`) are not part of the matcher,
 *    so the middleware never runs for them.
 *  - Gated routes (`/settings/*`, `/learn/*`, `/account/*`) require a session.
 *  - The home page (`/`) is matched but kept open via `unauthenticatedPaths`
 *    so the WorkOS session is still attached for client components that need it.
 */
export default authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ['/']
  }
})

export const config = {
  matcher: ['/', '/account/:page*', '/settings/:path*', '/learn/:path*']
}
