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

const ISO_WEEK_PATTERN = /^\d{4}-W\d{2}$/

export default function WeeklyList() {
  const utils = api.useUtils()
  const list = api.admin.challenges.weekly.list.useQuery()
  const [opened, { open, close }] = useDisclosure(false)
  const [isoWeek, setIsoWeek] = useState(currentIsoWeek())

  const create = api.admin.challenges.weekly.create.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Спидран создан.' })
      await utils.admin.challenges.weekly.list.invalidate()
      close()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  const remove = api.admin.challenges.weekly.delete.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Спидран удалён.' })
      await utils.admin.challenges.weekly.list.invalidate()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  return (
    <>
      <AdminCard
        title="Спидраны"
        description="Набор задач на ISO-неделю. Создаёшь сами задачи прямо в редакторе."
        actions={<Button onClick={() => open()}>Новый спидран</Button>}
        flush
      >
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Неделя</Table.Th>
              <Table.Th>Задач</Table.Th>
              <Table.Th>Попыток</Table.Th>
              <Table.Th aria-label="Действия" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {list.data?.map(row => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <Text fw={500}>{row.isoWeek}</Text>
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
                      href={`/admin/weekly/${row.id}`}
                      aria-label="Открыть редактор"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Удалить"
                      onClick={() => {
                        if (confirm(`Удалить спидран ${row.isoWeek}?`)) {
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

      <Modal opened={opened} onClose={close} title="Новый спидран" centered>
        <Stack>
          <TextInput
            label="ISO неделя"
            description="Формат YYYY-Www, например 2026-W17."
            value={isoWeek}
            onChange={event => setIsoWeek(event.currentTarget.value)}
            placeholder="2026-W17"
            required
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Отмена
            </Button>
            <Button
              onClick={() => create.mutate({ isoWeek })}
              loading={create.isPending}
              disabled={!ISO_WEEK_PATTERN.test(isoWeek)}
            >
              Создать
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

function currentIsoWeek(): string {
  const now = new Date()
  const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dayNumber = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNumber + 3)
  const firstThursday = Date.UTC(target.getUTCFullYear(), 0, 4)
  const week =
    1 +
    Math.round(
      ((target.getTime() - firstThursday) / 86_400_000 - 3 + (((firstThursday % 7) + 7) % 7)) / 7
    )
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
