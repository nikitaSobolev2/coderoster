import Link from 'next/link'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { env } from '~/env'
import { isTruthyFlag } from '~/server/lib/featureFlags'
import { userSyncService } from '~/server/services/UserSyncService'
import Logo from '~/shared/components/common/Logo'
import NavCategory from './NavCategory'
import SearchTrigger from './SearchTrigger'
import UserMenu, { type ViewerUser } from './UserMenu'
import { NAV_CATEGORIES } from './categories'
import styles from './styles.module.scss'

/**
 * Fixed top navigation rendered inside `PlatformShell`. Resolves the current
 * WorkOS session and syncs to the local DB so the menu reflects the canonical
 * username (handles renames + WorkOS email changes without 404s).
 */
export default async function PlatformHeader() {
  const viewer = await resolveViewer()

  return (
    <header className={styles.header}>
      <div className={styles.header__inner}>
        <Link href="/" className={styles.header__logo} aria-label="На главную">
          <Logo />
        </Link>
        <nav className={styles.header__nav} aria-label="Платформа">
          {NAV_CATEGORIES.map(category => (
            <NavCategory key={category.id} category={category} />
          ))}
        </nav>
        <div className={styles.header__actions}>
          <SearchTrigger />
          <UserMenu user={viewer} />
        </div>
      </div>
    </header>
  )
}

async function resolveViewer(): Promise<ViewerUser | null> {
  try {
    const session = await withAuth()
    if (!session.user) return null

    if (isTruthyFlag(env.USE_FAKE_DATA)) {
      console.log('[header] FAKE branch hit', {
        workosId: session.user.id,
        email: session.user.email
      })
      const username = session.user.email.split('@')[0] ?? session.user.id
      const displayName =
        [session.user.firstName, session.user.lastName].filter(Boolean).join(' ') ||
        session.user.email
      return {
        username,
        displayName,
        avatarUrl: session.user.profilePictureUrl ?? null
      }
    }

    const local = await userSyncService.syncFromSession({
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName ?? null,
      lastName: session.user.lastName ?? null,
      profilePictureUrl: session.user.profilePictureUrl ?? null
    })
    console.log('[header] resolved viewer', {
      workosId: session.user.id,
      localId: local.id,
      username: local.username,
      email: local.email
    })
    return {
      username: local.username,
      displayName: local.displayName,
      avatarUrl: local.avatarUrl
    }
  } catch (error) {
    console.error('[header] resolveViewer failed', error)
    return null
  }
}
