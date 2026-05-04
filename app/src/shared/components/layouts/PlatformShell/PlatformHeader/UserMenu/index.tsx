'use client'

import Link from 'next/link'
import { Avatar, Menu } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRightFromBracket,
  faGear,
  faShieldHalved,
  faTrophy,
  faUser
} from '@fortawesome/free-solid-svg-icons'
import styles from './styles.module.scss'

export interface ViewerUser {
  username: string
  displayName: string
  avatarUrl: string | null
  hasBackofficeAccess: boolean
  /** Deep link for «Панель управления»; avoids `/admin` when dashboard is role-restricted. */
  adminPanelHref: string
}

export interface Props {
  user: ViewerUser | null
}

export default function UserMenu({ user }: Readonly<Props>) {
  if (!user) {
    return (
      <Link href="/login" className={styles.signInLink} prefetch={false}>
        Войти
      </Link>
    )
  }

  return (
    <Menu position="bottom-end" offset={10} withinPortal={false}>
      <Menu.Target>
        <button type="button" className={styles.trigger} aria-label="Меню пользователя">
          <Avatar
            src={user.avatarUrl ?? undefined}
            alt={user.displayName}
            size={36}
            radius="xl"
            color="grape"
          >
            {initials(user.displayName)}
          </Avatar>
        </button>
      </Menu.Target>
      <Menu.Dropdown className={styles.dropdown}>
        <div className={styles.dropdown__header}>
          <span className={styles.dropdown__name}>{user.displayName}</span>
          <span className={styles.dropdown__handle}>@{user.username}</span>
        </div>
        <Menu.Divider className={styles.dropdown__dividerAfterHeader} />
        <Menu.Item
          leftSection={<FontAwesomeIcon icon={faUser} />}
          component={Link}
          href="/u/me"
          prefetch={false}
        >
          Мой профиль
        </Menu.Item>
        <Menu.Item
          leftSection={<FontAwesomeIcon icon={faTrophy} />}
          component={Link}
          href="/achievements"
          prefetch={false}
        >
          Достижения
        </Menu.Item>
        <Menu.Item
          leftSection={<FontAwesomeIcon icon={faGear} />}
          component={Link}
          href="/settings"
          prefetch={false}
        >
          Настройки
        </Menu.Item>
        {user.hasBackofficeAccess ? (
          <>
            <Menu.Divider />
            <Menu.Item
              leftSection={<FontAwesomeIcon icon={faShieldHalved} />}
              component={Link}
              href={user.adminPanelHref}
              prefetch={false}
            >
              Панель управления
            </Menu.Item>
          </>
        ) : null}
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<FontAwesomeIcon icon={faArrowRightFromBracket} />}
          component="a"
          href="/account/logout"
        >
          Выйти
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

function initials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}
