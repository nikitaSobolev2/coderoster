'use client'

import { useState } from 'react'
import { Button, Group, Stack, Table, Text } from '@mantine/core'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'
import { buildContactReplyMailto } from '~/features/contact/buildReplyMailto'

function sourceLabel(source: string): string {
  if (source === 'HOME') return 'Лендинг'
  if (source === 'PLATFORM') return 'Платформа'
  return source
}

export default function ContactMessagesAdmin() {
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const list = api.admin.contactMessages.list.useQuery({ cursor })

  return (
    <AdminCard title="Сообщения с формы" flush>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Источник</Table.Th>
            <Table.Th>Имя</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Сообщение</Table.Th>
            <Table.Th>Дата</Table.Th>
            <Table.Th aria-label="Ответ" />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {list.data?.items.map(row => (
            <Table.Tr key={row.id}>
              <Table.Td>
                <Text size="sm">{sourceLabel(row.source)}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" fw={500}>
                  {row.name}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed">
                  {row.email}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" lineClamp={4}>
                  {row.message}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed">
                  {row.createdAt.toLocaleString('ru-RU')}
                </Text>
              </Table.Td>
              <Table.Td align="right">
                <Button
                  component="a"
                  href={buildContactReplyMailto(row.email, row.message)}
                  size="xs"
                  variant="light"
                >
                  Ответить
                </Button>
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
