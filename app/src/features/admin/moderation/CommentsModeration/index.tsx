'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ActionIcon, Button, Group, Stack, Table, Text, TextInput } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTrash } from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'

export default function CommentsModeration() {
  const utils = api.useUtils()
  const [search, setSearch] = useState('')
  const [debounced] = useDebouncedValue(search, 300)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const list = api.admin.comments.list.useQuery({ q: debounced || undefined, cursor })
  const remove = api.admin.comments.delete.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Комментарий удалён.' })
      await utils.admin.comments.list.invalidate()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  return (
    <AdminCard
      title="Все комментарии"
      actions={
        <TextInput
          value={search}
          onChange={event => setSearch(event.currentTarget.value)}
          placeholder="Поиск по тексту"
          leftSection={<FontAwesomeIcon icon={faSearch} />}
          w={280}
        />
      }
      flush
    >
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Автор</Table.Th>
            <Table.Th>Сообщение</Table.Th>
            <Table.Th>Тред</Table.Th>
            <Table.Th>Дата</Table.Th>
            <Table.Th aria-label="Действия" />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {list.data?.items.map(row => (
            <Table.Tr key={row.id}>
              <Table.Td>
                <Link href={`/u/${row.authorUsername}`} style={{ color: 'inherit' }}>
                  <Text fw={500}>{row.authorDisplayName}</Text>
                </Link>
                <Text size="xs" c="dimmed">
                  @{row.authorUsername}
                </Text>
              </Table.Td>
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
            {list.data?.items.length ?? 0} строк
          </Text>
          <Group gap="xs">
            <Button variant="default" disabled={!cursor} onClick={() => setCursor(undefined)}>
              Сначала
            </Button>
            <Button
              variant="default"
              disabled={!list.data?.nextCursor}
              onClick={() => setCursor(list.data?.nextCursor ?? undefined)}
            >
              Дальше
            </Button>
          </Group>
        </Group>
      </Stack>
    </AdminCard>
  )
}
