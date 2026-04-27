'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPenToSquare,
  faPlus,
  faTrash,
  faUpRightFromSquare
} from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'

const PLACEMENT_OPTIONS = [
  { value: 'FOOTER', label: 'Подвал' },
  { value: 'HEADER', label: 'Шапка' },
  { value: 'HIDDEN', label: 'Скрыта' }
]

export default function ContentPagesTable() {
  const utils = api.useUtils()
  const router = useRouter()
  const list = api.admin.contentPages.list.useQuery()
  const [opened, { open, close }] = useDisclosure(false)
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [placement, setPlacement] = useState<'FOOTER' | 'HEADER' | 'HIDDEN'>('FOOTER')

  const create = api.admin.contentPages.create.useMutation({
    onSuccess: async newId => {
      notifications.show({ color: 'teal', message: 'Страница создана.' })
      await utils.admin.contentPages.list.invalidate()
      close()
      setSlug('')
      setTitle('')
      router.push(`/admin/content-pages/${newId}`)
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })
  const setPublished = api.admin.contentPages.setPublished.useMutation({
    onSuccess: async () => {
      await utils.admin.contentPages.list.invalidate()
    }
  })
  const remove = api.admin.contentPages.delete.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Страница удалена.' })
      await utils.admin.contentPages.list.invalidate()
    }
  })

  return (
    <>
      <AdminCard
        title="Список страниц"
        actions={
          <Button leftSection={<FontAwesomeIcon icon={faPlus} />} onClick={open}>
            Новая страница
          </Button>
        }
        flush
      >
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Slug</Table.Th>
              <Table.Th>Размещение</Table.Th>
              <Table.Th>Группа</Table.Th>
              <Table.Th>Опубликовано</Table.Th>
              <Table.Th aria-label="Действия" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {list.data?.map(page => (
              <Table.Tr key={page.id}>
                <Table.Td>
                  <Link href={`/admin/content-pages/${page.id}`} style={{ color: 'inherit' }}>
                    <Text fw={500}>{page.title}</Text>
                  </Link>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {page.excerpt}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    /p/{page.slug}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" radius="sm">
                    {page.placement.toLowerCase()}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {page.groupKey}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Switch
                    checked={page.published}
                    onChange={event =>
                      setPublished.mutate({
                        id: page.id,
                        published: event.currentTarget.checked
                      })
                    }
                  />
                </Table.Td>
                <Table.Td align="right">
                  <Group gap={4} justify="flex-end">
                    <ActionIcon
                      component={Link}
                      href={`/p/${page.slug}`}
                      target="_blank"
                      variant="subtle"
                      aria-label="Просмотр"
                    >
                      <FontAwesomeIcon icon={faUpRightFromSquare} />
                    </ActionIcon>
                    <ActionIcon
                      component={Link}
                      href={`/admin/content-pages/${page.id}`}
                      variant="subtle"
                      aria-label="Редактировать"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Удалить"
                      onClick={() => {
                        if (confirm(`Удалить «${page.title}»?`)) remove.mutate({ id: page.id })
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

      <Modal opened={opened} onClose={close} title="Новая страница" centered>
        <Stack>
          <TextInput
            label="Название"
            value={title}
            onChange={event => setTitle(event.currentTarget.value)}
            required
          />
          <TextInput
            label="Slug"
            value={slug}
            onChange={event => setSlug(event.currentTarget.value.toLowerCase())}
            required
          />
          <Select
            label="Размещение"
            value={placement}
            onChange={value => setPlacement((value as typeof placement) ?? placement)}
            data={PLACEMENT_OPTIONS}
            allowDeselect={false}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Отмена
            </Button>
            <Button
              loading={create.isPending}
              onClick={() =>
                create.mutate({
                  slug,
                  title,
                  body: `## ${title}\n\nЧто-то полезное.`,
                  placement
                })
              }
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
