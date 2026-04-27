'use client'

import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'
import IconOrImageField from '~/shared/components/ui/IconOrImageField'

interface CategoryRow {
  id: string
  slug: string
  title: string
  summary: string
  parentCategoryId: string | null
  iconKey: string | null
  imageUrl: string | null
  order: number
  courseCount: number
}

interface FormState {
  id: string | null
  slug: string
  title: string
  summary: string
  iconKey: string | null
  imageUrl: string | null
  parentCategoryId: string | null
  order: number
}

const EMPTY_FORM: FormState = {
  id: null,
  slug: '',
  title: '',
  summary: '',
  iconKey: null,
  imageUrl: null,
  parentCategoryId: null,
  order: 0
}

export default function CategoriesPanel() {
  const utils = api.useUtils()
  const list = api.admin.catalog.categories.list.useQuery()
  const [opened, { open, close }] = useDisclosure(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const create = api.admin.catalog.categories.create.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Категория создана.' })
      await utils.admin.catalog.categories.list.invalidate()
      close()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })
  const update = api.admin.catalog.categories.update.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Категория сохранена.' })
      await utils.admin.catalog.categories.list.invalidate()
      close()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })
  const remove = api.admin.catalog.categories.delete.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Категория удалена.' })
      await utils.admin.catalog.categories.list.invalidate()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  const parentOptions = useMemo(
    () => (list.data ?? []).map(category => ({ value: category.id, label: category.title })),
    [list.data]
  )

  const startCreate = () => {
    setForm(EMPTY_FORM)
    open()
  }

  const startEdit = (category: CategoryRow) => {
    setForm({
      id: category.id,
      slug: category.slug,
      title: category.title,
      summary: category.summary,
      iconKey: category.iconKey,
      imageUrl: category.imageUrl,
      parentCategoryId: category.parentCategoryId,
      order: category.order
    })
    open()
  }

  const submit = () => {
    const payload = {
      slug: form.slug,
      title: form.title,
      summary: form.summary,
      iconKey: form.iconKey,
      imageUrl: form.imageUrl,
      parentCategoryId: form.parentCategoryId,
      order: form.order
    }
    if (form.id) {
      update.mutate({ id: form.id, patch: payload })
    } else {
      create.mutate(payload)
    }
  }

  return (
    <>
      <AdminCard
        title="Список категорий"
        actions={<Button onClick={startCreate}>Новая категория</Button>}
        flush
      >
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Slug</Table.Th>
              <Table.Th>Родитель</Table.Th>
              <Table.Th>Курсов</Table.Th>
              <Table.Th>Порядок</Table.Th>
              <Table.Th aria-label="Действия" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {list.data?.map(category => (
              <Table.Tr key={category.id}>
                <Table.Td>
                  <Text fw={500}>{category.title}</Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {category.summary}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {category.slug}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {category.parentCategoryId
                      ? list.data?.find(item => item.id === category.parentCategoryId)?.title
                      : '—'}
                  </Text>
                </Table.Td>
                <Table.Td>{category.courseCount}</Table.Td>
                <Table.Td>{category.order}</Table.Td>
                <Table.Td align="right">
                  <Group gap={4} justify="flex-end">
                    <ActionIcon
                      variant="subtle"
                      onClick={() => startEdit(category)}
                      aria-label="Редактировать"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => {
                        if (confirm(`Удалить «${category.title}»?`)) {
                          remove.mutate({ id: category.id })
                        }
                      }}
                      aria-label="Удалить"
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

      <Modal
        opened={opened}
        onClose={close}
        title={form.id ? 'Редактирование' : 'Новая категория'}
        centered
      >
        <Stack>
          <TextInput
            label="Название"
            value={form.title}
            onChange={event => {
              const { value } = event.currentTarget
              setForm(state => ({ ...state, title: value }))
            }}
            required
          />
          <TextInput
            label="Slug"
            value={form.slug}
            onChange={event => {
              const slug = event.currentTarget.value.toLowerCase()
              setForm(state => ({ ...state, slug }))
            }}
            required
          />
          <Textarea
            label="Описание"
            value={form.summary}
            onChange={event => {
              const { value } = event.currentTarget
              setForm(state => ({ ...state, summary: value }))
            }}
            autosize
            minRows={2}
            maxLength={500}
          />
          <IconOrImageField
            key={form.id ?? 'new-category'}
            label="Иконка или картинка"
            value={{ iconKey: form.iconKey, imageUrl: form.imageUrl }}
            onChange={next =>
              setForm(state => ({ ...state, iconKey: next.iconKey, imageUrl: next.imageUrl }))
            }
            uploadKind="ACHIEVEMENT_COVER"
            imageAspectRatio="1 / 1"
            hint="Иконка показывается в каталоге; картинка имеет приоритет, если загружена."
          />
          <Select
            label="Родительская категория"
            value={form.parentCategoryId}
            onChange={value => setForm(state => ({ ...state, parentCategoryId: value ?? null }))}
            data={parentOptions.filter(option => option.value !== form.id)}
            clearable
          />
          <TextInput
            label="Порядок"
            value={String(form.order)}
            onChange={event => {
              const order = Number(event.currentTarget.value) || 0
              setForm(state => ({ ...state, order }))
            }}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Отмена
            </Button>
            <Button
              onClick={submit}
              loading={create.isPending || update.isPending}
              disabled={!form.slug || !form.title}
            >
              Сохранить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
