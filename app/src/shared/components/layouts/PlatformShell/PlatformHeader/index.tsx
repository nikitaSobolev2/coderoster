import Link from 'next/link'
import { withAuth } from '@workos-inc/authkit-nextjs'
import Logo from '~/shared/components/common/Logo'
import NavCategory from './NavCategory'
import SearchTrigger from './SearchTrigger'
import UserMenu, { type ViewerUser } from './UserMenu'
import { NAV_CATEGORIES } from './categories'
import styles from './styles.module.scss'

/**
 * Fixed top navigation rendered inside `PlatformShell`. Resolves the current
 * WorkOS session server-side so the menu reflects the real user without an
 * extra client round-trip.
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
    const username = session.user.email.split('@')[0] ?? session.user.id
    const displayName =
      [session.user.firstName, session.user.lastName].filter(Boolean).join(' ') ||
      session.user.email
    return {
      username,
      displayName,
      avatarUrl: session.user.profilePictureUrl ?? null
    }
  } catch {
    return null
  }
}
