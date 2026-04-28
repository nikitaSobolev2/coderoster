import { getSignInUrl } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

/**
 * Forces the WorkOS hosted sign-in screen to ALWAYS prompt the user, even
 * when the upstream IdP still has an active session for the previous
 * account. Without `prompt=login`, AuthKit silently re-issues a session for
 * the cached identity, which surprises users who explicitly clicked
 * "Войти" after signing out.
 */
export const GET = async () => {
  const signInUrl = await getSignInUrl()
  return redirect(withForcedPrompt(signInUrl))
}

function withForcedPrompt(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('prompt', 'login')
    return parsed.toString()
  } catch {
    return url
  }
}
