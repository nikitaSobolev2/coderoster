import Link from 'next/link'
import { Avatar } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import AdminMobileMenu from '../AdminMobileMenu'
import type { AdminNavGroup } from '../AdminSidebar/nav-config'
import { adminSidebarBrandHref } from '../AdminSidebar/nav-config'
import { SITE_NAME } from '~/shared/constants/site'
import type { BackofficeRole } from '~/shared/types/backoffice'
import styles from './styles.module.scss'

export interface AdminViewer {
  username: string
  displayName: string
  avatarUrl: string | null
}

export interface BackofficeShellViewer extends AdminViewer {
  role: BackofficeRole
}

export interface Props {
  viewer: BackofficeShellViewer
  navGroups: AdminNavGroup[]
}

/**
 * Slim top bar shown above the admin content area. Renders the actor avatar
 * and a one-click "Open as user" jump back to the public profile so admins
 * can verify how their changes land for learners.
 */
function backofficeLabel(role: BackofficeRole): string {
  switch (role) {
    case 'admin':
      return 'Админ-панель'
    case 'moderator':
      return 'Модерация'
    case 'author':
      return 'Мои курсы'
    default:
      return 'Панель'
  }
}

export default function AdminTopbar({ viewer, navGroups }: Props) {
  const brandHref = adminSidebarBrandHref(viewer.role)
  return (
    <header className={styles.topbar}>
      <div className={styles.topbar__left}>
        <AdminMobileMenu navGroups={navGroups} brandHref={brandHref} />
        <span className={styles.topbar__label}>
          {SITE_NAME} · {backofficeLabel(viewer.role)}
        </span>
      </div>
      <div className={styles.topbar__right}>
        <Link href={`/u/${viewer.username}`} className={styles.topbar__viewAs}>
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          <span>Открыть профиль</span>
        </Link>
        <div className={styles.topbar__actor}>
          <Avatar
            src={viewer.avatarUrl ?? undefined}
            alt={viewer.displayName}
            size={32}
            radius="xl"
          >
            {initials(viewer.displayName)}
          </Avatar>
          <div className={styles.topbar__actor_meta}>
            <span className={styles.topbar__actor_name}>{viewer.displayName}</span>
            <span className={styles.topbar__actor_handle}>@{viewer.username}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

function initials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}
