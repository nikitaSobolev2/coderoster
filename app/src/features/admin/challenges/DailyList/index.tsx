'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  TextInput
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export default function DailyList() {
  const utils = api.useUtils()
  const list = api.admin.challenges.daily.list.useQuery()
  const [opened, { open, close }] = useDisclosure(false)
  const [date, setDate] = useState(today())

  const create = api.admin.challenges.daily.create.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Дейлик создан.' })
      await utils.admin.challenges.daily.list.invalidate()
      close()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  const remove = api.admin.challenges.daily.delete.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Дейлик удалён.' })
      await utils.admin.challenges.daily.list.invalidate()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  return (
    <>
      <AdminCard
        title="Дейлики"
        description="Каждый день — отдельный набор задач, который ты собираешь полностью здесь."
        actions={<Button onClick={() => open()}>Новый дейлик</Button>}
        flush
      >
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Дата</Table.Th>
              <Table.Th>Задач</Table.Th>
              <Table.Th>Попыток</Table.Th>
              <Table.Th aria-label="Действия" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {list.data?.map(row => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <Text fw={500}>{row.date}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" radius="sm">
                    {row.taskCount}
                  </Badge>
                </Table.Td>
                <Table.Td>{row.attemptCount}</Table.Td>
                <Table.Td align="right">
                  <Group gap={4} justify="flex-end">
                    <ActionIcon
                      variant="subtle"
                      component={Link}
                      href={`/admin/daily/${row.id}`}
                      aria-label="Открыть редактор"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Удалить"
                      onClick={() => {
                        if (confirm(`Удалить дейлик за ${row.date}?`)) {
                          remove.mutate({ id: row.id })
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </AdminCard>

      <Modal opened={opened} onClose={close} title="Новый дейлик" centered>
        <Stack>
          <TextInput
            label="Дата"
            description="Формат YYYY-MM-DD."
            value={date}
            onChange={event => setDate(event.currentTarget.value)}
            placeholder="2026-04-28"
            required
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Отмена
            </Button>
            <Button
              onClick={() => create.mutate({ date })}
              loading={create.isPending}
              disabled={!DATE_PATTERN.test(date)}
            >
              Создать
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}
