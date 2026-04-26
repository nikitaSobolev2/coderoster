'use client'

import Link from 'next/link'
import { Avatar, Menu } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRightFromBracket,
  faGear,
  faTrophy,
  faUser
} from '@fortawesome/free-solid-svg-icons'
import styles from './styles.module.scss'

export interface ViewerUser {
  username: string
  displayName: string
  avatarUrl: string | null
}

export interface Props {
  user: ViewerUser | null
}

export default function UserMenu({ user }: Props) {
  if (!user) {
    return (
      <Link href="/login" className={styles.signInLink}>
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
        <Menu.Divider />
        <Menu.Item
          leftSection={<FontAwesomeIcon icon={faUser} />}
          component={Link}
          href={`/u/${user.username}`}
        >
          Мой профиль
        </Menu.Item>
        <Menu.Item
          leftSection={<FontAwesomeIcon icon={faTrophy} />}
          component={Link}
          href="/coming-soon"
        >
          Достижения
        </Menu.Item>
        <Menu.Item
          leftSection={<FontAwesomeIcon icon={faGear} />}
          component={Link}
          href="/settings"
        >
          Настройки
        </Menu.Item>
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
