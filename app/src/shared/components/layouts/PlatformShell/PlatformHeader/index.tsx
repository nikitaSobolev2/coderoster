import Link from 'next/link'
import { Role } from '@prisma/client'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { env } from '~/env'
import { isTruthyFlag } from '~/server/lib/featureFlags'
import {
  clearSignupAuthFlowCookie,
  resolvePendingSignupConsentOptions
} from '~/server/auth/pendingSignupConsentSync'
import { normalizeWorkosSessionEmail } from '~/server/auth/workosSessionEmail'
import { getAppRepositories } from '~/server/repositories'
import { userSyncService } from '~/server/services/UserSyncService'
import Logo from '~/shared/components/common/Logo'
import NavCategory from './NavCategory'
import SearchTrigger from './SearchTrigger'
import UserMenu, { type ViewerUser } from './UserMenu'
import MobileMenu from './MobileMenu'
import PlatformHeaderLiveChatButton from './PlatformHeaderLiveChatButton'
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
        <Link href="/courses" className={styles.header__logo} aria-label="На главную">
          <Logo />
        </Link>
        <nav className={styles.header__nav} aria-label="Платформа">
          {navCategories.map(category => (
            <NavCategory key={category.id} category={category} />
          ))}
        </nav>
        <div className={styles.header__actions}>
          <PlatformHeaderLiveChatButton />
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
    const categoryTree = await getAppRepositories().course.listCategoriesNavTree()
    if (categoryTree.length === 0) return null
    return {
      id: 'categories',
      label: 'Категории',
      categoryTree
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
      const fakeEmail = normalizeWorkosSessionEmail(session.user.email) ?? `${session.user.id}@fake`
      if (env.NODE_ENV === 'development') {
        console.log('[header] FAKE branch hit', { workosId: session.user.id })
      }
      const username = fakeEmail.split('@')[0] ?? session.user.id
      const displayName =
        [session.user.firstName, session.user.lastName].filter(Boolean).join(' ') || fakeEmail
      return {
        username,
        displayName,
        avatarUrl: session.user.profilePictureUrl ?? null,
        hasBackofficeAccess: false
      }
    }

    const sessionEmail = normalizeWorkosSessionEmail(session.user.email)
    if (!sessionEmail) return null

    const consentOpts = await resolvePendingSignupConsentOptions(sessionEmail)
    const local = await userSyncService.syncFromSession(
      {
        id: session.user.id,
        email: sessionEmail,
        firstName: session.user.firstName ?? null,
        lastName: session.user.lastName ?? null,
        profilePictureUrl: session.user.profilePictureUrl ?? null
      },
      consentOpts
    )
    if (consentOpts) await clearSignupAuthFlowCookie()
    if (env.NODE_ENV === 'development') {
      console.log('[header] resolved viewer', { localId: local.id, username: local.username })
    }
    return {
      username: local.username,
      displayName: local.displayName,
      avatarUrl: local.avatarUrl,
      hasBackofficeAccess:
        local.role === Role.ADMIN || local.role === Role.MODERATOR || local.role === Role.AUTHOR
    }
  } catch (error) {
    console.error('[header] resolveViewer failed', error)
    return null
  }
}
