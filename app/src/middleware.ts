import { authkitMiddleware } from '@workos-inc/authkit-nextjs'

/**
 * Auth strategy:
 *  - Catch-all matcher: middleware runs on every page + API route so
 *    `withAuth()` and the `useAuth()` provider always receive session headers.
 *  - `unauthenticatedPaths` lists routes that allow anonymous access; gated
 *    routes (`/settings/*`, `/learn/*`, `/account/*`) auto-redirect to login.
 */
export default authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: [
      '/',
      '/courses',
      '/courses/:slug*',
      '/plans',
      '/plans/:path*',
      '/u/:username*',
      '/leaderboard',
      '/achievements',
      '/coming-soon',
      '/p/:slug*',
      '/banned',
      '/api/:path*',
      '/login',
      '/login/password',
      '/login/code',
      '/login/forgot-password',
      '/login/reset-password',
      '/signup',
      '/signup/password',
      '/signup/code',
      '/auth/:path*',
      '/callback',
      '/logout',
      '/account/logout'
    ]
  }
})

// Do not use `.*\\..*` here — it skips `/api/trpc/course.list` etc.; `withAuth` then throws
// "isn't covered by the AuthKit middleware". WorkOS catch-all: exclude only Next internals + favicon.
export const config = {
  matcher: ['/((?!_next/static|_next/image|_next/data|favicon.ico|assets).*)']
}
