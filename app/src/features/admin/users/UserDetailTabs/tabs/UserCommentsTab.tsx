'use client'

import { useState } from 'react'
import { ActionIcon, Button, Group, Stack, Table, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'

export interface Props {
  userId: string
}

/**
 * Comments authored by a single user, listed across every Thread. Reuses
 * `admin.comments.delete` so moderation actions live in one router.
 */
export default function UserCommentsTab({ userId }: Props) {
  const [cursor, setCursor] = useState<string | null>(null)
  const utils = api.useUtils()
  const query = api.admin.users.listComments.useQuery({ id: userId, cursor })

  const remove = api.admin.comments.delete.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Комментарий удалён.' })
      await utils.admin.users.listComments.invalidate({ id: userId })
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  return (
    <AdminCard title="Комментарии" flush>
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Сообщение</Table.Th>
            <Table.Th>Тред</Table.Th>
            <Table.Th>Дата</Table.Th>
            <Table.Th aria-label="Действия" />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {query.data?.items.map(row => (
            <Table.Tr key={row.id}>
              <Table.Td>
                <Text size="sm" lineClamp={3}>
                  {row.message}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed">
                  {row.threadId}
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
                  onClick={() => remove.mutate({ id: row.id })}
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
