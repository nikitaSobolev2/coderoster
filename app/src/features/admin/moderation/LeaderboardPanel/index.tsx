'use client'

import Link from 'next/link'
import { Avatar, Badge, Group, Switch, Table, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'

export default function LeaderboardPanel() {
  const utils = api.useUtils()
  const list = api.admin.leaderboard.list.useQuery({})
  const setExclusion = api.admin.leaderboard.setExclusion.useMutation({
    onSuccess: async () => {
      await utils.admin.leaderboard.list.invalidate()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  return (
    <AdminCard title="Текущий рейтинг" flush>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Пользователь</Table.Th>
            <Table.Th>XP</Table.Th>
            <Table.Th>В рейтинге</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {list.data?.map(row => (
            <Table.Tr key={row.userId}>
              <Table.Td>
                <Group gap="sm">
                  <Avatar src={row.avatarUrl ?? undefined} size={28} radius="xl">
                    {row.displayName.slice(0, 1).toUpperCase()}
                  </Avatar>
                  <div>
                    <Link href={`/admin/users/${row.userId}`} style={{ color: 'inherit' }}>
                      <Text fw={500}>{row.displayName}</Text>
                    </Link>
                    <Text size="xs" c="dimmed">
                      @{row.username}
                    </Text>
                  </div>
                </Group>
              </Table.Td>
              <Table.Td>
                <Badge variant="light" radius="sm">
                  {row.totalXp.toLocaleString('ru-RU')}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Switch
                  checked={!row.excludedFromLeaderboard}
                  onChange={event =>
                    setExclusion.mutate({
                      userId: row.userId,
                      excluded: !event.currentTarget.checked
                    })
                  }
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </AdminCard>
  )
}
