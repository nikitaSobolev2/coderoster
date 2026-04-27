'use client'

import { Badge, Button, Group, Stack, Switch, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'

export interface Props {
  userId: string
}

/**
 * Per-user achievement grid. Toggle = grant/revoke; revocation deletes the
 * `UserAchievementTrack` row, so the engine will recompute from scratch on
 * next trigger.
 */
export default function UserAchievementsTab({ userId }: Props) {
  const utils = api.useUtils()
  const status = api.admin.users.listAchievementStatus.useQuery({ id: userId })

  const grant = api.admin.users.grantAchievement.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Достижение выдано.' })
      await utils.admin.users.listAchievementStatus.invalidate({ id: userId })
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })
  const revoke = api.admin.users.revokeAchievement.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Достижение снято.' })
      await utils.admin.users.listAchievementStatus.invalidate({ id: userId })
    },
    onError: error => notifications.show({ color: 'red', message: error.message })
  })

  return (
    <AdminCard title="Достижения" description="Выдай или сними любое достижение каталога.">
      {status.isLoading ? <Text c="dimmed">Загрузка…</Text> : null}
      <Stack gap="xs">
        {status.data?.map(item => (
          <Group key={item.id} justify="space-between" align="center">
            <Group gap="sm">
              <Text fw={500}>{item.title}</Text>
              <Badge variant="light" radius="sm">
                {item.category}
              </Badge>
              <Badge variant="outline" radius="sm" color="gray">
                {item.rarity}
              </Badge>
              {item.hidden ? (
                <Badge variant="outline" radius="sm" color="grape">
                  скрытое
                </Badge>
              ) : null}
            </Group>
            <Group gap="xs">
              {item.earnedAt ? (
                <Text size="xs" c="dimmed">
                  получено {item.earnedAt.toLocaleDateString('ru-RU')}
                </Text>
              ) : null}
              <Switch
                checked={item.earned}
                onChange={event => {
                  if (event.currentTarget.checked) {
                    grant.mutate({ id: userId, achievementId: item.id })
                  } else {
                    revoke.mutate({ id: userId, achievementId: item.id })
                  }
                }}
                aria-label={`Переключить ${item.title}`}
              />
            </Group>
          </Group>
        ))}
      </Stack>
      <Group justify="flex-end" mt="md">
        <Button variant="default" component="a" href="/admin/achievements">
          Каталог достижений
        </Button>
      </Group>
    </AdminCard>
  )
}
