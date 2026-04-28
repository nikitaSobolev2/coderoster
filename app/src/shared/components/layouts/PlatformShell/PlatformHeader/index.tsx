import Link from 'next/link'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons'
import { env } from '~/env'
import { isTruthyFlag } from '~/server/lib/featureFlags'
import { getAppRepositories } from '~/server/repositories'
import { userSyncService } from '~/server/services/UserSyncService'
import Logo from '~/shared/components/common/Logo'
import NavCategory from './NavCategory'
import SearchTrigger from './SearchTrigger'
import UserMenu, { type ViewerUser } from './UserMenu'
import MobileMenu from './MobileMenu'
import { NAV_CATEGORIES, type NavCategoryConfig } from './categories'
import styles from './styles.module.scss'

/**
 * Fixed top navigation rendered inside `PlatformShell`. Resolves the current
 * WorkOS session and syncs to the local DB so the menu reflects the canonical
 * username (handles renames + WorkOS email changes without 404s).
 */
export default async function PlatformHeader() {
  const [viewer, navCategories] = await Promise.all([resolveViewer(), resolveNavCategories()])

  return (
    <header className={styles.header}>
      <div className={styles.header__inner}>
        <Link href="/" className={styles.header__logo} aria-label="На главную">
          <Logo />
        </Link>
        <nav className={styles.header__nav} aria-label="Платформа">
          {navCategories.map(category => (
            <NavCategory key={category.id} category={category} />
          ))}
        </nav>
        <div className={styles.header__actions}>
          <SearchTrigger />
          <UserMenu user={viewer} />
          <MobileMenu categories={navCategories} />
        </div>
      </div>
    </header>
  )
}

/**
 * Splices the live "Категории" mega-menu (CMS-managed `CourseCategory` rows)
 * in front of the static nav so that learners see the editorial taxonomy
 * the admin curates without redeploying the front-end.
 */
async function resolveNavCategories(): Promise<NavCategoryConfig[]> {
  const dynamicCategory = await buildCategoriesNavEntry()
  if (!dynamicCategory) return NAV_CATEGORIES
  return [dynamicCategory, ...NAV_CATEGORIES]
}

async function buildCategoriesNavEntry(): Promise<NavCategoryConfig | null> {
  try {
    const categories = await getAppRepositories().course.listCategories()
    if (categories.length === 0) return null
    return {
      id: 'categories',
      label: 'Категории',
      items: categories.map(category => ({
        id: `category-${category.slug}`,
        title: category.title,
        description: 'Курсы по категории',
        href: `/courses?category=${category.slug}`,
        icon: faLayerGroup
      }))
    }
  } catch (error) {
    console.error('[header] resolveNavCategories failed', error)
    return null
  }
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
        avatarUrl: session.user.profilePictureUrl ?? null,
        isAdmin: false
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
      avatarUrl: local.avatarUrl,
      isAdmin: local.role === 'ADMIN'
    }
  } catch (error) {
    console.error('[header] resolveViewer failed', error)
    return null
  }
}
