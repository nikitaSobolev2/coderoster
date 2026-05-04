'use client'

import { useState } from 'react'
import { Alert, Button, Group, Stack, Textarea, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'
import type { RouterOutputs } from '~/trpc/react'

type ModerationUser = RouterOutputs['admin']['users']['moderationGet']

export interface Props {
  user: ModerationUser
}

function isCurrentlyChatBanned(chatBannedUntil: Date | null | undefined): boolean {
  if (!chatBannedUntil) return false
  return chatBannedUntil.getTime() > Date.now()
}

export default function ModerationChatTab({ user }: Props) {
  const utils = api.useUtils()
  const [chatUntil, setChatUntil] = useState<string>('')
  const [chatReason, setChatReason] = useState<string>(user.chatBanReason ?? '')

  const chatMute = api.admin.users.moderationChatMute.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Блокировка чата применена.' })
      await utils.admin.users.moderationGet.invalidate({ id: user.id })
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })
  const chatUnmute = api.admin.users.moderationChatUnmute.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Блокировка чата снята.' })
      await utils.admin.users.moderationGet.invalidate({ id: user.id })
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  const isChatMuted = isCurrentlyChatBanned(user.chatBannedUntil)

  return (
    <AdminCard title="Чат" description="Блокировка отправки в живом чате.">
      {isChatMuted ? (
        <Alert color="orange" variant="light" mb="md">
          Чат заблокирован до {user.chatBannedUntil?.toLocaleString('ru-RU')}.{' '}
          {user.chatBanReason ? `Причина: ${user.chatBanReason}.` : ''}
        </Alert>
      ) : null}
      <Stack gap="md">
        <Group grow>
          <TextInput
            label="Блокировка чата до (ISO)"
            placeholder="2026-12-31T00:00:00Z"
            value={chatUntil}
            onChange={event => setChatUntil(event.currentTarget.value)}
          />
        </Group>
        <Textarea
          label="Причина"
          value={chatReason}
          onChange={event => setChatReason(event.currentTarget.value)}
          autosize
          minRows={2}
          maxLength={500}
        />
        <Group justify="flex-end" gap="xs">
          <Button
            variant="default"
            onClick={() => chatUnmute.mutate({ id: user.id })}
            loading={chatUnmute.isPending}
            disabled={!isChatMuted}
          >
            Снять блокировку чата
          </Button>
          <Button
            variant="light"
            color="orange"
            onClick={() =>
              chatMute.mutate({
                id: user.id,
                until: 'permanent',
                reason: chatReason || 'без причины'
              })
            }
            loading={chatMute.isPending}
          >
            Заблокировать чат навсегда
          </Button>
          <Button
            color="orange"
            onClick={() => {
              if (!chatUntil) {
                notifications.show({
                  color: 'red',
                  message: 'Укажи ISO-дату или нажми «Навсегда».'
                })
                return
              }
              chatMute.mutate({
                id: user.id,
                until: chatUntil,
                reason: chatReason || 'без причины'
              })
            }}
            loading={chatMute.isPending}
          >
            Заблокировать чат до даты
          </Button>
        </Group>
      </Stack>
    </AdminCard>
  )
}
