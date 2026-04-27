'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Menu,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput
} from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEllipsisVertical,
  faSearch,
  faTrash,
  faUpRightFromSquare
} from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'next/navigation'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'

type StatusFilter = 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'all'

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: 'Все',
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликован',
  HIDDEN: 'Скрыт'
}

export default function CoursesTable() {
  const utils = api.useUtils()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [status, setStatus] = useState<StatusFilter>('all')

  const query = api.admin.catalog.courses.list.useQuery({
    q: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status
  })

  const create = api.admin.catalog.courses.create.useMutation({
    onSuccess: async newId => {
      notifications.show({ color: 'teal', message: 'Курс создан.' })
      await utils.admin.catalog.courses.list.invalidate()
      router.push(`/admin/courses/${newId}`)
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })
  const setStatusMutation = api.admin.catalog.courses.setStatus.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Статус обновлён.' })
      await utils.admin.catalog.courses.list.invalidate()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })
  const remove = api.admin.catalog.courses.delete.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Курс удалён.' })
      await utils.admin.catalog.courses.list.invalidate()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  return (
    <>
      <AdminCard
        title={`Каталог курсов · ${query.data?.total ?? '…'}`}
        actions={
          <Group gap="xs" wrap="wrap">
            <TextInput
              value={search}
              onChange={event => setSearch(event.currentTarget.value)}
              placeholder="Поиск по названию / slug"
              leftSection={<FontAwesomeIcon icon={faSearch} />}
              w={240}
            />
            <Select
              value={status}
              onChange={value => setStatus((value as StatusFilter) ?? 'all')}
              data={(['all', 'DRAFT', 'PUBLISHED', 'HIDDEN'] as StatusFilter[]).map(value => ({
                value,
                label: STATUS_LABEL[value]
              }))}
              w={160}
            />
            <CreateCourseButton onCreate={create.mutate} loading={create.isPending} />
          </Group>
        }
        flush
      >
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Курс</Table.Th>
              <Table.Th>Язык</Table.Th>
              <Table.Th>Сложность</Table.Th>
              <Table.Th>Модулей / задач</Table.Th>
              <Table.Th>Учеников</Table.Th>
              <Table.Th>Статус</Table.Th>
              <Table.Th aria-label="Действия" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {query.data?.items.map(course => (
              <Table.Tr key={course.id}>
                <Table.Td>
                  <Link href={`/admin/courses/${course.id}`} style={{ color: 'inherit' }}>
                    <Text fw={500}>{course.title}</Text>
                  </Link>
                  <Text size="xs" c="dimmed">
                    /{course.slug}
                  </Text>
                </Table.Td>
                <Table.Td>{course.language}</Table.Td>
                <Table.Td>{course.difficulty}</Table.Td>
                <Table.Td>
                  {course.moduleCount} / {course.taskCount}
                </Table.Td>
                <Table.Td>{course.enrollmentCount}</Table.Td>
                <Table.Td>
                  <Badge variant="light" color={statusColor(course.status)} radius="sm">
                    {STATUS_LABEL[course.status as StatusFilter]}
                  </Badge>
                </Table.Td>
                <Table.Td align="right">
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <ActionIcon variant="subtle" aria-label="Действия">
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<FontAwesomeIcon icon={faUpRightFromSquare} />}
                        component={Link}
                        href={`/admin/courses/${course.id}`}
                      >
                        Открыть редактор
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        onClick={() =>
                          setStatusMutation.mutate({ id: course.id, status: 'PUBLISHED' })
                        }
                        disabled={course.status === 'PUBLISHED'}
                      >
                        Опубликовать
                      </Menu.Item>
                      <Menu.Item
                        onClick={() => setStatusMutation.mutate({ id: course.id, status: 'DRAFT' })}
                        disabled={course.status === 'DRAFT'}
                      >
                        В черновики
                      </Menu.Item>
                      <Menu.Item
                        onClick={() =>
                          setStatusMutation.mutate({ id: course.id, status: 'HIDDEN' })
                        }
                        disabled={course.status === 'HIDDEN'}
                      >
                        Скрыть
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<FontAwesomeIcon icon={faTrash} />}
                        onClick={() => {
                          if (confirm(`Удалить курс «${course.title}»? Это необратимо.`)) {
                            remove.mutate({ id: course.id })
                          }
                        }}
                      >
                        Удалить
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </AdminCard>
    </>
  )
}

function CreateCourseButton({
  onCreate,
  loading
}: {
  onCreate: (input: { slug: string; title: string }) => void
  loading: boolean
}) {
  const [opened, { open, close }] = useDisclosure(false)
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  return (
    <>
      <Button onClick={open} variant="filled">
        Новый курс
      </Button>
      <Modal opened={opened} onClose={close} title="Новый курс" centered>
        <Stack>
          <TextInput
            label="Название"
            value={title}
            onChange={event => setTitle(event.currentTarget.value)}
            required
          />
          <TextInput
            label="Slug (a-z, 0-9, -)"
            value={slug}
            onChange={event => setSlug(event.currentTarget.value.toLowerCase())}
            required
            placeholder="python-basics"
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={close}>
              Отмена
            </Button>
            <Button
              loading={loading}
              onClick={() => {
                onCreate({ slug, title })
                close()
                setSlug('')
                setTitle('')
              }}
              disabled={!slug || !title}
            >
              Создать
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

function statusColor(status: string): string {
  switch (status) {
    case 'PUBLISHED':
      return 'green'
    case 'HIDDEN':
      return 'gray'
    default:
      return 'yellow'
  }
}
