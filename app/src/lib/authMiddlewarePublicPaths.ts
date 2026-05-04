import { parse, tokensToRegexp } from 'path-to-regexp'

/**
 * Path globs allowed without a WorkOS session (must stay in sync with middleware).
 * Same semantics as AuthKit `middlewareAuth.unauthenticatedPaths`.
 */
export const UNAUTHENTICATED_PATH_GLOBS: readonly string[] = [
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

function pathGlobToRegex(pathGlob: string): RegExp {
  const url = new URL(pathGlob, 'https://example.com')
  const path = `${url.pathname}${url.hash || ''}`
  const tokens = parse(path)
  return new RegExp(tokensToRegexp(tokens).source)
}

/** True when `pathname` matches at least one unauthenticated glob. */
export function isUnauthenticatedMiddlewarePath(pathname: string): boolean {
  return UNAUTHENTICATED_PATH_GLOBS.some(glob => pathGlobToRegex(glob).exec(pathname) != null)
}
