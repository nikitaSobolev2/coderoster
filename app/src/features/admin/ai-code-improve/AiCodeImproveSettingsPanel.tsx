'use client'

import { Button, Stack, Text, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'

export default function AiCodeImproveSettingsPanel() {
  const utils = api.useUtils()
  const query = api.admin.aiCodeImprove.get.useQuery()
  const mutation = api.admin.aiCodeImprove.update.useMutation({
    onSuccess: async () => {
      await utils.admin.aiCodeImprove.get.invalidate()
      notifications.show({ color: 'teal', message: 'Модель сохранена.' })
    },
    onError: error => notifications.show({ color: 'red', title: 'Ошибка', message: error.message })
  })

  if (!query.data) {
    return <Text size="sm">Загрузка…</Text>
  }

  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        const fd = new FormData(event.currentTarget)
        const model = String(fd.get('model') ?? '').trim()
        if (model.length === 0) return
        mutation.mutate({ model })
      }}
    >
      <Stack gap="md" maw={480}>
        <Text size="sm" c="dimmed">
          Модель OpenAI-compatible чата для воркера ИИ-разбора (Go:{' '}
          <code>workers/code-improve</code>).
          Хранится в <code>AppSetting.ai_code_improve</code>.
        </Text>
        <TextInput
          name="model"
          label="Model id"
          defaultValue={query.data.model}
          placeholder="gpt-4o-mini"
        />
        <Button type="submit" loading={mutation.isPending}>
          Сохранить
        </Button>
      </Stack>
    </form>
  )
}
