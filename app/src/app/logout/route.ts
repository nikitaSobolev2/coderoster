import { signOut } from '@workos-inc/authkit-nextjs'
import { canonicalPublicOrigin } from '~/lib/requestOrigin'

/**
 * Alias for `/account/logout`. Hosted dashboards and bookmarks often use `/logout`.
 */
export async function GET() {
  return signOut({ returnTo: `${canonicalPublicOrigin()}/` })
}

export async function POST() {
  return signOut({ returnTo: `${canonicalPublicOrigin()}/` })
}
