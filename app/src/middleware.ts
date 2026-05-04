import type { NextRequest } from 'next/server'
import { authkit, handleAuthkitHeaders } from '@workos-inc/authkit-nextjs'

import { isUnauthenticatedMiddlewarePath } from '~/lib/authMiddlewarePublicPaths'

/**
 * Auth strategy:
 * - Run AuthKit `authkit()` so session refresh + `x-workos-*` headers stay aligned with
 *   `withAuth()` / tRPC context.
 * - Do **not** use `middlewareAuth.enabled` (that redirects guests to **hosted** WorkOS).
 * - Guests on protected routes go to in-app `/login` instead; OAuth/magic/password still
 *   complete via `/callback` and `saveSession`.
 */
export default async function middleware(request: NextRequest) {
  const { session, headers } = await authkit(request)

  if (!session.user && !isUnauthenticatedMiddlewarePath(request.nextUrl.pathname)) {
    const login = new URL('/login', request.url)
    const returnPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
    login.searchParams.set('next', returnPath)
    return handleAuthkitHeaders(request, headers, { redirect: login })
  }

  return handleAuthkitHeaders(request, headers)
}

// Do not use `.*\\..*` here — it skips `/api/trpc/course.list` etc.; `withAuth` then throws
// "isn't covered by the AuthKit middleware". WorkOS catch-all: exclude only Next internals + favicon.
export const config = {
  matcher: ['/((?!_next/static|_next/image|_next/data|favicon.ico|assets).*)']
}
