'use client'

import { useState } from 'react'
import { Badge, Button, Group, Stack, Table, Text, TextInput } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'

export default function AuditTable() {
  const [actorId, setActorId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [debouncedActor] = useDebouncedValue(actorId, 300)
  const [debouncedTarget] = useDebouncedValue(targetId, 300)
  const [cursor, setCursor] = useState<string | undefined>(undefined)

  const list = api.admin.audit.list.useQuery({
    actorId: debouncedActor || undefined,
    targetId: debouncedTarget || undefined,
    cursor
  })

  return (
    <AdminCard
      title="Журнал"
      actions={
        <Group gap="xs">
          <TextInput
            value={actorId}
            onChange={event => setActorId(event.currentTarget.value)}
            placeholder="actorId"
            w={220}
          />
          <TextInput
            value={targetId}
            onChange={event => setTargetId(event.currentTarget.value)}
            placeholder="targetId"
            w={220}
          />
        </Group>
      }
      flush
    >
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Когда</Table.Th>
            <Table.Th>Кто</Table.Th>
            <Table.Th>Действие</Table.Th>
            <Table.Th>Цель</Table.Th>
            <Table.Th>Diff</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {list.data?.items.map(row => (
            <Table.Tr key={row.id}>
              <Table.Td>
                <Text size="xs" c="dimmed">
                  {row.createdAt.toLocaleString('ru-RU')}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{row.actorUsername ?? '—'}</Text>
                <Text size="xs" c="dimmed">
                  {row.actorId ?? '—'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge variant="light" radius="sm">
                  {row.action}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed">
                  {row.targetType} · {row.targetId}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed" lineClamp={3} style={{ maxWidth: 480 }}>
                  {JSON.stringify(row.diff ?? {})}
                </Text>
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
