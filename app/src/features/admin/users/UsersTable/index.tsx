'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Badge, Button, Group, Menu, Select, Table, Text, TextInput } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical, faSearch } from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'
import { useBackofficeRole } from '~/shared/components/layouts/AdminShell/BackofficeRoleContext'
import styles from './styles.module.scss'

type RoleFilter = 'LEARNER' | 'AUTHOR' | 'MODERATOR' | 'ADMIN' | 'all'
type BanFilter = 'all' | 'banned' | 'active'

/**
 * Client-side users table. Server prefetched the first page; subsequent
 * filter/search queries hit tRPC directly. Renders Mantine Table for
 * keyboard accessibility and consistent styling.
 */
export default function UsersTable() {
  const backofficeRole = useBackofficeRole()
  const isModeration = backofficeRole === 'moderator'

  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [role, setRole] = useState<RoleFilter>('all')
  const [banned, setBanned] = useState<BanFilter>('all')

  const adminQuery = api.admin.users.list.useQuery(
    {
      q: debouncedSearch || undefined,
      role: role === 'all' ? undefined : role,
      banned
    },
    { enabled: !isModeration }
  )

  const modQuery = api.admin.users.moderationList.useQuery(
    {
      q: debouncedSearch || undefined,
      role: role === 'all' ? undefined : role,
      banned
    },
    { enabled: isModeration }
  )

  const query = isModeration ? modQuery : adminQuery
  const moderationRows = modQuery.data?.items
  const adminRows = adminQuery.data?.items

  return (
    <AdminCard
      title="Каталог пользователей"
      description={`Всего: ${query.data?.total ?? '…'}`}
      actions={
        <Group gap="xs" wrap="wrap">
          <TextInput
            value={search}
            onChange={event => setSearch(event.currentTarget.value)}
            placeholder={isModeration ? 'Поиск ник / имя' : 'Поиск ник / email / имя'}
            leftSection={<FontAwesomeIcon icon={faSearch} />}
            w={240}
          />
          <Select
            value={role}
            onChange={value => setRole((value as RoleFilter) ?? 'all')}
            data={[
              { value: 'all', label: 'Все роли' },
              { value: 'LEARNER', label: 'Ученик' },
              { value: 'AUTHOR', label: 'Автор' },
              { value: 'MODERATOR', label: 'Модератор' },
              { value: 'ADMIN', label: 'Админ' }
            ]}
            w={160}
          />
          <Select
            value={banned}
            onChange={value => setBanned((value as BanFilter) ?? 'all')}
            data={[
              { value: 'all', label: 'Все' },
              { value: 'banned', label: 'В бане' },
              { value: 'active', label: 'Активные' }
            ]}
            w={140}
          />
        </Group>
      }
      flush
    >
      <Table verticalSpacing="sm" highlightOnHover className={styles.table}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Пользователь</Table.Th>
            <Table.Th>Роль</Table.Th>
            {!isModeration ? (
              <>
                <Table.Th>Тариф</Table.Th>
                <Table.Th>XP / Стрик</Table.Th>
              </>
            ) : null}
            <Table.Th>Статус</Table.Th>
            <Table.Th>Создан</Table.Th>
            <Table.Th aria-label="Действия" />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isModeration
            ? moderationRows?.map(user => (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    <div className={styles.user}>
                      <Link href={`/admin/users/${user.id}`} className={styles.user__name}>
                        {user.displayName}
                      </Link>
                      <Text size="xs" c="dimmed">
                        @{user.username}
                      </Text>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={roleColor(user.role)} radius="sm">
                      {user.role.toLowerCase()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {renderModerationStatus(user.bannedUntil, user.chatBannedUntil)}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {user.joinedAt.toLocaleDateString('ru-RU')}
                    </Text>
                  </Table.Td>
                  <Table.Td align="right">
                    <UserRowMenu userId={user.id} />
                  </Table.Td>
                </Table.Tr>
              ))
            : adminRows?.map(user => (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    <div className={styles.user}>
                      <Link href={`/admin/users/${user.id}`} className={styles.user__name}>
                        {user.displayName}
                      </Link>
                      <Text size="xs" c="dimmed">
                        @{user.username} · {user.email}
                      </Text>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={roleColor(user.role)} radius="sm">
                      {user.role.toLowerCase()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {user.plan ? (
                      <>
                        <Text size="sm">{user.plan.name}</Text>
                        <Text size="xs" c="dimmed">
                          tier {user.plan.tierLevel} · {user.plan.slug}
                        </Text>
                      </>
                    ) : (
                      <Text size="sm" c="dimmed">
                        —
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{user.totalXp.toLocaleString('ru-RU')} XP</Text>
                    <Text size="xs" c="dimmed">
                      стрик {user.streakDays} дн
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {renderStatus(user.bannedUntil, user.excludedFromLeaderboard)}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {user.joinedAt.toLocaleDateString('ru-RU')}
                    </Text>
                  </Table.Td>
                  <Table.Td align="right">
                    <UserRowMenu userId={user.id} />
                  </Table.Td>
                </Table.Tr>
              ))}
        </Table.Tbody>
      </Table>
      {query.isLoading ? (
        <div className={styles.placeholder}>Загрузка…</div>
      ) : (isModeration ? moderationRows?.length === 0 : adminRows?.length === 0) ? (
        <div className={styles.placeholder}>Никого не нашли. Попробуй другой запрос.</div>
      ) : null}
    </AdminCard>
  )
}

function UserRowMenu({ userId }: { userId: string }) {
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <Button
          variant="subtle"
          color="gray"
          size="compact-sm"
          aria-label="Действия"
          leftSection={<FontAwesomeIcon icon={faEllipsisVertical} />}
        />
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item component={Link} href={`/admin/users/${userId}`}>
          Открыть
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

function renderModerationStatus(bannedUntil: Date | null, chatBannedUntil: Date | null) {
  const tags: ReactNode[] = []
  if (bannedUntil && bannedUntil.getTime() > Date.now()) {
    const isPermanent = bannedUntil.getFullYear() > 9000
    tags.push(
      <Badge key="ban" color="red" variant="light" radius="sm">
        {isPermanent ? 'бан · навсегда' : `бан до ${bannedUntil.toLocaleDateString('ru-RU')}`}
      </Badge>
    )
  }
  if (chatBannedUntil && chatBannedUntil.getTime() > Date.now()) {
    tags.push(
      <Badge key="chat" color="orange" variant="light" radius="sm">
        чат до {chatBannedUntil.toLocaleDateString('ru-RU')}
      </Badge>
    )
  }
  if (tags.length === 0) {
    tags.push(
      <Badge key="ok" color="green" variant="light" radius="sm">
        активен
      </Badge>
    )
  }
  return (
    <Group gap={6} wrap="wrap">
      {tags}
    </Group>
  )
}

function roleColor(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'red'
    case 'MODERATOR':
      return 'orange'
    case 'AUTHOR':
      return 'grape'
    default:
      return 'gray'
  }
}

function renderStatus(bannedUntil: Date | null, excluded: boolean) {
  const tags: ReactNode[] = []
  if (bannedUntil && bannedUntil.getTime() > Date.now()) {
    const isPermanent = bannedUntil.getFullYear() > 9000
    tags.push(
      <Badge key="ban" color="red" variant="light" radius="sm">
        {isPermanent ? 'бан · навсегда' : `бан до ${bannedUntil.toLocaleDateString('ru-RU')}`}
      </Badge>
    )
  } else {
    tags.push(
      <Badge key="ok" color="green" variant="light" radius="sm">
        активен
      </Badge>
    )
  }
  if (excluded) {
    tags.push(
      <Badge key="exclude" color="gray" variant="outline" radius="sm">
        не в рейтинге
      </Badge>
    )
  }
  return (
    <Group gap={6} wrap="wrap">
      {tags}
    </Group>
  )
}
