import { signOut } from '@workos-inc/authkit-nextjs'
import { canonicalPublicOrigin } from '~/lib/requestOrigin'

/**
 * Sign-out endpoint linked from the user menu and the settings Account /
 * Danger cards. WorkOS clears the session then sends the user home (`/`).
 */
export async function GET() {
  return signOut({ returnTo: `${canonicalPublicOrigin()}/` })
}

export async function POST() {
  return signOut({ returnTo: `${canonicalPublicOrigin()}/` })
}
