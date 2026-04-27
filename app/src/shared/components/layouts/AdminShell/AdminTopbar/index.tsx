import Link from 'next/link'
import { Avatar } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import styles from './styles.module.scss'

export interface AdminViewer {
  username: string
  displayName: string
  avatarUrl: string | null
}

export interface Props {
  viewer: AdminViewer
}

/**
 * Slim top bar shown above the admin content area. Renders the actor avatar
 * and a one-click "Open as user" jump back to the public profile so admins
 * can verify how their changes land for learners.
 */
export default function AdminTopbar({ viewer }: Props) {
  return (
    <header className={styles.topbar}>
      <span className={styles.topbar__label}>CodeRoster · Admin</span>
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
