'use client'

import { useState } from 'react'
import {
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Tabs,
  Textarea,
  TextInput
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'
import MarkdownEditor from '~/shared/components/ui/MarkdownEditor'
import type { RouterOutputs } from '~/trpc/react'

type ContentPage = RouterOutputs['admin']['contentPages']['get']

const PLACEMENT_OPTIONS = [
  { value: 'FOOTER', label: 'Подвал' },
  { value: 'HEADER', label: 'Шапка' },
  { value: 'HIDDEN', label: 'Скрыта' }
]

export interface Props {
  page: ContentPage
}

export default function ContentPageEditor({ page }: Props) {
  const utils = api.useUtils()
  const [slug, setSlug] = useState(page.slug)
  const [title, setTitle] = useState(page.title)
  const [excerpt, setExcerpt] = useState(page.excerpt)
  const [body, setBody] = useState(page.body)
  const [placement, setPlacement] = useState<'FOOTER' | 'HEADER' | 'HIDDEN'>(page.placement)
  const [groupKey, setGroupKey] = useState(page.groupKey)
  const [order, setOrder] = useState<number | string>(page.order)
  const [published, setPublished] = useState(page.published)

  const update = api.admin.contentPages.update.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Страница сохранена.' })
      await utils.admin.contentPages.get.invalidate({ id: page.id })
      await utils.admin.contentPages.list.invalidate()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  const submit = () => {
    update.mutate({
      id: page.id,
      patch: {
        slug,
        title,
        body,
        excerpt,
        placement,
        groupKey,
        order: typeof order === 'number' ? order : Number(order) || 0,
        published
      }
    })
  }

  return (
    <AdminCard
      title="Редактирование"
      actions={
        <Button onClick={submit} loading={update.isPending}>
          Сохранить
        </Button>
      }
    >
      <Tabs defaultValue="meta">
        <Tabs.List>
          <Tabs.Tab value="meta">Карточка</Tabs.Tab>
          <Tabs.Tab value="body">Тело (Markdown)</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="meta" pt="md">
          <Stack gap="md">
            <Group grow>
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
            </Group>
            <Textarea
              label="Excerpt"
              value={excerpt}
              onChange={event => setExcerpt(event.currentTarget.value)}
              autosize
              minRows={2}
              maxLength={500}
            />
            <Group grow>
              <Select
                label="Размещение"
                value={placement}
                onChange={value => setPlacement((value as typeof placement) ?? placement)}
                data={PLACEMENT_OPTIONS}
                allowDeselect={false}
              />
              <TextInput
                label="Группа"
                value={groupKey}
                onChange={event => setGroupKey(event.currentTarget.value)}
                placeholder="about, support, legal"
              />
              <NumberInput
                label="Порядок"
                value={order}
                onChange={value => setOrder(value)}
                min={0}
              />
            </Group>
            <Switch
              label="Опубликовано"
              checked={published}
              onChange={event => setPublished(event.currentTarget.checked)}
            />
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="body" pt="md">
          <MarkdownEditor
            label="Markdown"
            value={body}
            onChange={setBody}
            withImageUpload
            imageUploadKind="CONTENT_PAGE_INLINE"
            minRows={22}
          />
        </Tabs.Panel>
      </Tabs>
    </AdminCard>
  )
}
