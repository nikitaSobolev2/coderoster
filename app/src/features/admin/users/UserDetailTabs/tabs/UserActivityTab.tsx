'use client'

import { useState } from 'react'
import { ActionIcon, Badge, Button, Group, Stack, Table, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'

export interface Props {
  userId: string
}

/**
 * Paged activity log with delete action. Cursor-based; "Дальше" loads the
 * next page in place. Each delete triggers a refresh — the dataset is small
 * enough that we don't need optimistic UI here.
 */
export default function UserActivityTab({ userId }: Props) {
  const [cursor, setCursor] = useState<string | null>(null)
  const utils = api.useUtils()
  const query = api.admin.users.listActivity.useQuery({ id: userId, cursor })

  const remove = api.admin.users.deleteActivity.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Запись активности удалена.' })
      await utils.admin.users.listActivity.invalidate({ id: userId })
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  return (
    <AdminCard title="Активность" flush>
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Тип</Table.Th>
            <Table.Th>Пейлоад</Table.Th>
            <Table.Th>Дата</Table.Th>
            <Table.Th aria-label="Действия" />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {query.data?.items.map(row => (
            <Table.Tr key={row.id}>
              <Table.Td>
                <Badge variant="light" radius="sm">
                  {row.type}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {JSON.stringify(row.payload ?? {})}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed">
                  {row.createdAt.toLocaleString('ru-RU')}
                </Text>
              </Table.Td>
              <Table.Td align="right">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label="Удалить"
                  onClick={() => remove.mutate({ activityId: row.id })}
                  loading={remove.isPending}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Stack p="md">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {query.data?.items.length ?? 0} строк на странице
          </Text>
          <Group gap="xs">
            <Button variant="default" disabled={!cursor} onClick={() => setCursor(null)}>
              Сначала
            </Button>
            <Button
              variant="default"
              disabled={!query.data?.nextCursor}
              onClick={() => setCursor(query.data?.nextCursor ?? null)}
            >
              Дальше
            </Button>
          </Group>
        </Group>
      </Stack>
    </AdminCard>
  )
}
