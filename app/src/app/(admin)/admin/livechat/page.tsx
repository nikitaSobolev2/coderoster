'use client'

import { Stack, Switch, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'

export default function AdminLivechatSettingsPage() {
  const utils = api.useUtils()
  const query = api.admin.livechat.getGuestPolicy.useQuery()
  const mutation = api.admin.livechat.setGuestPolicy.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Настройки чата сохранены.' })
      await utils.admin.livechat.getGuestPolicy.invalidate()
    },
    onError: error => notifications.show({ color: 'red', title: 'Чат', message: error.message })
  })

  const allowGuests = query.data?.allowGuests ?? true

  return (
    <>
      <AdminPageHeader title="Живой чат" subtitle="Глобальные правила отправки сообщений." />
      <AdminCard title="Гости">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Если выключено — писать могут только авторизованные пользователи (гости видят ленту).
          </Text>
          <Switch
            label="Разрешить гостям отправку сообщений"
            checked={allowGuests}
            disabled={query.isLoading || mutation.isPending}
            onChange={event => mutation.mutate({ allowGuests: event.currentTarget.checked })}
          />
        </Stack>
      </AdminCard>
    </>
  )
}
