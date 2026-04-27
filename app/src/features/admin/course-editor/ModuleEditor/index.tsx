'use client'

import { useState } from 'react'
import { Button, Group, Stack, Textarea, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'

export interface Props {
  moduleId: string
  title: string
  description: string
}

export default function ModuleEditor({ moduleId, title, description }: Props) {
  const utils = api.useUtils()
  const [moduleTitle, setModuleTitle] = useState(title)
  const [moduleDescription, setModuleDescription] = useState(description)

  const update = api.admin.courseEditor.module.update.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Модуль сохранён.' })
      await utils.admin.courseEditor.get.invalidate()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  return (
    <AdminCard
      title="Модуль"
      actions={
        <Button
          loading={update.isPending}
          onClick={() =>
            update.mutate({
              moduleId,
              patch: { title: moduleTitle, description: moduleDescription }
            })
          }
        >
          Сохранить
        </Button>
      }
    >
      <Stack gap="md">
        <TextInput
          label="Название"
          value={moduleTitle}
          onChange={event => setModuleTitle(event.currentTarget.value)}
          required
        />
        <Textarea
          label="Описание"
          value={moduleDescription}
          onChange={event => setModuleDescription(event.currentTarget.value)}
          autosize
          minRows={2}
          maxLength={800}
        />
        <Group justify="space-between">
          <span />
        </Group>
      </Stack>
    </AdminCard>
  )
}
