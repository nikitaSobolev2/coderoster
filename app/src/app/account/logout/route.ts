import { signOut } from '@workos-inc/authkit-nextjs'

/**
 * Sign-out endpoint linked from the user menu and the settings Account /
 * Danger cards. Delegates to WorkOS AuthKit which clears the session cookie
 * and redirects to the configured WorkOS logout URL — finishing the round
 * trip on the marketing landing page.
 */
export async function GET() {
  await signOut()
}

export async function POST() {
  await signOut()
}
