'use client'

import { useState } from 'react'
import { Button, Group, Stack, TagsInput, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'

export default function LanguagesPanel() {
  const list = api.admin.languages.list.useQuery()
  if (!list.data) return null
  return <LanguagesEditor key={list.data.join(',')} initial={list.data} />
}

function LanguagesEditor({ initial }: { initial: string[] }) {
  const utils = api.useUtils()
  const [languages, setLanguages] = useState<string[]>(initial)

  const update = api.admin.languages.update.useMutation({
    onSuccess: async data => {
      notifications.show({ color: 'teal', message: 'Список языков обновлён.' })
      setLanguages(data)
      await utils.admin.languages.list.invalidate()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  return (
    <AdminCard
      title="Языки задач"
      description="Слаги (lowercase). Слаг должен совпадать с именем образа в Go-runner."
      actions={
        <Button onClick={() => update.mutate({ languages })} loading={update.isPending}>
          Сохранить
        </Button>
      }
    >
      <Stack gap="md">
        <TagsInput
          value={languages}
          onChange={setLanguages}
          placeholder="например python, php, javascript"
          maxTags={40}
          clearable
        />
        <Group>
          <Text size="sm" c="dimmed">
            Текущее значение: {languages.length === 0 ? 'пусто' : languages.join(', ')}
          </Text>
        </Group>
      </Stack>
    </AdminCard>
  )
}
