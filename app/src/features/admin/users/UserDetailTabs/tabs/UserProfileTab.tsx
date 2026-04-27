'use client'

import { useState } from 'react'
import { Button, Group, NumberInput, Stack, Switch, Textarea, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'
import ImageUploadField from '~/shared/components/ui/ImageUploadField'
import type { AdminUserDetail } from '../index'

export interface Props {
  user: AdminUserDetail
}

/**
 * Editable profile fields. Username + email change are admin-only operations
 * that bypass WorkOS — kept off the regular settings flow on purpose.
 */
export default function UserProfileTab({ user }: Props) {
  const utils = api.useUtils()
  const [displayName, setDisplayName] = useState(user.displayName)
  const [username, setUsername] = useState(user.username)
  const [email, setEmail] = useState(user.email)
  const [bio, setBio] = useState(user.bio)
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '')
  const [totalXp, setTotalXp] = useState<number | string>(user.totalXp)
  const [streakDays, setStreakDays] = useState<number | string>(user.streakDays)
  const [excluded, setExcluded] = useState(user.excludedFromLeaderboard)

  const update = api.admin.users.update.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Профиль обновлён.' })
      await utils.admin.users.get.invalidate({ id: user.id })
      await utils.admin.users.list.invalidate()
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  const submit = () => {
    update.mutate({
      id: user.id,
      patch: {
        displayName,
        username,
        email,
        bio,
        avatarUrl: avatarUrl || null,
        totalXp: typeof totalXp === 'number' ? totalXp : Number(totalXp) || 0,
        streakDays: typeof streakDays === 'number' ? streakDays : Number(streakDays) || 0,
        excludedFromLeaderboard: excluded
      }
    })
  }

  return (
    <AdminCard title="Профиль" description="Редактируй имя, ник, ссылки и счётчики геймификации.">
      <Stack gap="md">
        <Group grow>
          <TextInput
            label="Отображаемое имя"
            value={displayName}
            onChange={event => setDisplayName(event.currentTarget.value)}
            required
          />
          <TextInput
            label="Ник"
            value={username}
            onChange={event => setUsername(event.currentTarget.value)}
            required
          />
        </Group>
        <TextInput
          label="Email"
          value={email}
          onChange={event => setEmail(event.currentTarget.value)}
          type="email"
          required
        />
        <ImageUploadField
          label="Аватар"
          value={avatarUrl || null}
          onChange={value => setAvatarUrl(value ?? '')}
          kind="AVATAR"
          variant="avatar"
          hint="Квадратная картинка, до 4 МБ. Будет обрезана в круг."
        />
        <Textarea
          label="Био"
          value={bio}
          onChange={event => setBio(event.currentTarget.value)}
          autosize
          minRows={3}
          maxLength={500}
        />
        <Group grow>
          <NumberInput
            label="Total XP"
            value={totalXp}
            onChange={value => setTotalXp(value)}
            min={0}
            allowNegative={false}
          />
          <NumberInput
            label="Стрик (дней)"
            value={streakDays}
            onChange={value => setStreakDays(value)}
            min={0}
            allowNegative={false}
          />
        </Group>
        <Switch
          label="Исключить из лидерборда"
          checked={excluded}
          onChange={event => setExcluded(event.currentTarget.checked)}
        />
        <Group justify="flex-end">
          <Button onClick={submit} loading={update.isPending} variant="filled">
            Сохранить
          </Button>
        </Group>
      </Stack>
    </AdminCard>
  )
}
