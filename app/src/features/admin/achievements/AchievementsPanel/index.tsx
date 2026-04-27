'use client'

import { useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
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

const CATEGORY_OPTIONS = [
  { value: 'progression', label: 'Прогресс' },
  { value: 'streak', label: 'Стрик' },
  { value: 'speed', label: 'Скорость' },
  { value: 'completionist', label: 'Полнота' },
  { value: 'hidden', label: 'Скрытые' }
]

const RARITY_OPTIONS = [
  { value: 'common', label: 'common' },
  { value: 'rare', label: 'rare' },
  { value: 'epic', label: 'epic' },
  { value: 'legendary', label: 'legendary' }
]

interface FormState {
  id: string | null
  slug: string
  title: string
  description: string
  category: string
  rarity: string
  goal: string
  hidden: boolean
  coverImage: string | null
  imageUrl: string | null
}

const EMPTY: FormState = {
  id: null,
  slug: '',
  title: '',
  description: '',
  category: 'progression',
  rarity: 'common',
  goal: '',
  hidden: false,
  coverImage: null,
  imageUrl: null
}

export default function AchievementsPanel() {
  const utils = api.useUtils()
  const list = api.admin.achievements.list.useQuery()
  const [opened, { open, close }] = useDisclosure(false)
  const [form, setForm] = useState<FormState>(EMPTY)

  const create = api.admin.achievements.create.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Достижение создано.' })
      await utils.admin.achievements.list.invalidate()
      close()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })
  const update = api.admin.achievements.update.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Достижение сохранено.' })
      await utils.admin.achievements.list.invalidate()
      close()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })
  const remove = api.admin.achievements.delete.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Достижение удалено.' })
      await utils.admin.achievements.list.invalidate()
    }
  })

  const startCreate = () => {
    setForm(EMPTY)
    open()
  }

  const startEdit = (achievement: NonNullable<typeof list.data>[number]) => {
    setForm({
      id: achievement.id,
      slug: achievement.slug,
      title: achievement.title,
      description: achievement.description,
      category: achievement.category,
      rarity: achievement.rarity,
      goal: achievement.goal != null ? String(achievement.goal) : '',
      hidden: achievement.hidden,
      coverImage: achievement.coverImage,
      imageUrl: achievement.imageUrl
    })
    open()
  }

  const submit = () => {
    const payload = {
      slug: form.slug,
      title: form.title,
      description: form.description,
      category: form.category,
      rarity: form.rarity,
      goal: form.goal === '' ? null : Number(form.goal),
      hidden: form.hidden,
      coverImage: form.coverImage,
      imageUrl: form.imageUrl
    }
    if (form.id) update.mutate({ id: form.id, patch: payload })
    else create.mutate(payload)
  }

  return (
    <>
      <AdminCard
        title="Каталог"
        actions={<Button onClick={startCreate}>Новое достижение</Button>}
        flush
      >
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Категория</Table.Th>
              <Table.Th>Редкость</Table.Th>
              <Table.Th>Цель</Table.Th>
              <Table.Th>Скрытое</Table.Th>
              <Table.Th aria-label="Действия" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {list.data?.map(achievement => (
              <Table.Tr key={achievement.id}>
                <Table.Td>
                  <Text fw={500}>{achievement.title}</Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {achievement.description}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" radius="sm">
                    {achievement.category}
                  </Badge>
                </Table.Td>
                <Table.Td>{achievement.rarity}</Table.Td>
                <Table.Td>{achievement.goal ?? '—'}</Table.Td>
                <Table.Td>{achievement.hidden ? 'да' : 'нет'}</Table.Td>
                <Table.Td align="right">
                  <Group gap={4} justify="flex-end">
                    <ActionIcon
                      variant="subtle"
                      onClick={() => startEdit(achievement)}
                      aria-label="Редактировать"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Удалить"
                      onClick={() => {
                        if (confirm(`Удалить «${achievement.title}»?`)) {
                          remove.mutate({ id: achievement.id })
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

      <Modal
        opened={opened}
        onClose={close}
        title={form.id ? 'Редактирование' : 'Новое достижение'}
        centered
        size="lg"
      >
        <Stack>
          <Group grow>
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
          </Group>
          <Textarea
            label="Описание"
            value={form.description}
            onChange={event => {
              const { value } = event.currentTarget
              setForm(state => ({ ...state, description: value }))
            }}
            autosize
            minRows={2}
            maxLength={800}
            required
          />
          <Group grow>
            <Select
              label="Категория"
              value={form.category}
              onChange={value =>
                setForm(state => ({ ...state, category: value ?? state.category }))
              }
              data={CATEGORY_OPTIONS}
              allowDeselect={false}
            />
            <Select
              label="Редкость"
              value={form.rarity}
              onChange={value => setForm(state => ({ ...state, rarity: value ?? state.rarity }))}
              data={RARITY_OPTIONS}
              allowDeselect={false}
            />
          </Group>
          <NumberInput
            label="Цель (необязательно)"
            value={form.goal}
            onChange={value => setForm(state => ({ ...state, goal: String(value ?? '') }))}
            min={0}
            allowNegative={false}
          />
          <IconOrImageField
            key={form.id ?? 'new-achievement'}
            label="Обложка ачивки"
            value={{ iconKey: form.coverImage, imageUrl: form.imageUrl }}
            onChange={next =>
              setForm(state => ({
                ...state,
                coverImage: next.iconKey,
                imageUrl: next.imageUrl
              }))
            }
            uploadKind="ACHIEVEMENT_COVER"
            imageAspectRatio="1 / 1"
            hint="Иконка из библиотеки или квадратная картинка до 8 МБ."
          />
          <Switch
            label="Скрытое (название не раскрывается до получения)"
            checked={form.hidden}
            onChange={event => {
              const { checked } = event.currentTarget
              setForm(state => ({ ...state, hidden: checked }))
            }}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Отмена
            </Button>
            <Button
              onClick={submit}
              loading={create.isPending || update.isPending}
              disabled={!form.slug || !form.title || !form.description}
            >
              Сохранить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
