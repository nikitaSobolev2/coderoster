'use client'

import { useState } from 'react'
import { Alert, Button, Group, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'
import type { AdminUserDetail } from '../index'

export interface Props {
  user: AdminUserDetail
}

const ROLES = [
  { value: 'LEARNER', label: 'Ученик' },
  { value: 'AUTHOR', label: 'Автор' },
  { value: 'MODERATOR', label: 'Модератор' },
  { value: 'ADMIN', label: 'Админ' }
] as const

function isCurrentlyBanned(bannedUntil: Date | null | undefined): boolean {
  if (!bannedUntil) return false
  return bannedUntil.getTime() > Date.now()
}

function isCurrentlyChatBanned(chatBannedUntil: Date | null | undefined): boolean {
  if (!chatBannedUntil) return false
  return chatBannedUntil.getTime() > Date.now()
}

/**
 * Role assignment + ban controls. Bans accept ISO date OR `permanent`.
 * Self-ban / self-demote is rejected on the server too — UI defends in depth.
 */
export default function UserRoleBanTab({ user }: Props) {
  const utils = api.useUtils()
  const [role, setRole] = useState(user.role)
  const [until, setUntil] = useState<string>('')
  const [reason, setReason] = useState<string>(user.banReason ?? '')
  const [chatUntil, setChatUntil] = useState<string>('')
  const [chatReason, setChatReason] = useState<string>(user.chatBanReason ?? '')

  const updateRole = api.admin.users.update.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Роль обновлена.' })
      await utils.admin.users.get.invalidate({ id: user.id })
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })
  const ban = api.admin.users.ban.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Бан применён.' })
      await utils.admin.users.get.invalidate({ id: user.id })
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })
  const unban = api.admin.users.unban.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Бан снят.' })
      await utils.admin.users.get.invalidate({ id: user.id })
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  const chatMute = api.admin.users.chatMute.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Блокировка чата применена.' })
      await utils.admin.users.get.invalidate({ id: user.id })
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })
  const chatUnmute = api.admin.users.chatUnmute.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Блокировка чата снята.' })
      await utils.admin.users.get.invalidate({ id: user.id })
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  const isBanned = isCurrentlyBanned(user.bannedUntil)
  const isChatMuted = isCurrentlyChatBanned(user.chatBannedUntil)

  return (
    <Stack>
      <AdminCard title="Роль">
        <Group align="end" wrap="wrap">
          <Select
            value={role}
            onChange={value => setRole((value as AdminUserDetail['role']) ?? role)}
            data={[...ROLES]}
            label="Роль"
            w={220}
          />
          <Button
            onClick={() => updateRole.mutate({ id: user.id, patch: { role } })}
            loading={updateRole.isPending}
          >
            Применить
          </Button>
        </Group>
      </AdminCard>

      <AdminCard
        title="Бан"
        description="Введи ISO дату для временной блокировки или нажми «Навсегда»."
      >
        {isBanned ? (
          <Alert color="red" variant="light" mb="md">
            Сейчас в бане до {user.bannedUntil?.toLocaleString('ru-RU')}.{' '}
            {user.banReason ? `Причина: ${user.banReason}.` : ''}
          </Alert>
        ) : null}
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="Бан до (ISO)"
              placeholder="2026-12-31T00:00:00Z"
              value={until}
              onChange={event => setUntil(event.currentTarget.value)}
            />
          </Group>
          <Textarea
            label="Причина"
            value={reason}
            onChange={event => setReason(event.currentTarget.value)}
            autosize
            minRows={2}
            maxLength={500}
          />
          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              onClick={() => unban.mutate({ id: user.id })}
              loading={unban.isPending}
              disabled={!isBanned}
            >
              Снять бан
            </Button>
            <Button
              variant="light"
              color="red"
              onClick={() =>
                ban.mutate({ id: user.id, until: 'permanent', reason: reason || 'без причины' })
              }
              loading={ban.isPending}
            >
              Забанить навсегда
            </Button>
            <Button
              color="red"
              onClick={() => {
                if (!until) {
                  notifications.show({
                    color: 'red',
                    message: 'Укажи ISO-дату или нажми «Навсегда».'
                  })
                  return
                }
                ban.mutate({ id: user.id, until, reason: reason || 'без причины' })
              }}
              loading={ban.isPending}
            >
              Забанить до даты
            </Button>
          </Group>
        </Stack>
      </AdminCard>

      <AdminCard title="Чат" description="Отдельная блокировка отправки сообщений в живом чате.">
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
    </Stack>
  )
}
