'use client'

import { Stack, Tabs, Text } from '@mantine/core'
import type { RouterOutputs } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'
import UserCommentsTab from '../UserDetailTabs/tabs/UserCommentsTab'
import ModerationChatTab from '../UserDetailTabs/tabs/ModerationChatTab'

export type ModerationUserDetail = RouterOutputs['admin']['users']['moderationGet']

export interface Props {
  initialUser: ModerationUserDetail
}

export default function ModerationUserDetailTabs({ initialUser }: Props) {
  const user = initialUser
  return (
    <Tabs defaultValue="profile" keepMounted={false}>
      <Tabs.List>
        <Tabs.Tab value="profile">Профиль</Tabs.Tab>
        <Tabs.Tab value="chat">Чат</Tabs.Tab>
        <Tabs.Tab value="comments">Комментарии</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="profile" pt="lg">
        <AdminCard title="Данные пользователя">
          <Stack gap="xs">
            <Text>
              <strong>Ник:</strong> @{user.username}
            </Text>
            <Text>
              <strong>Имя:</strong> {user.displayName}
            </Text>
            <Text>
              <strong>Роль:</strong> {user.role.toLowerCase()}
            </Text>
            <Text size="sm" c="dimmed">
              Email и тариф скрыты в режиме модератора.
            </Text>
            <Text size="sm" c="dimmed">
              Комментариев: {user.counts.comments} · Активностей: {user.counts.activities}
            </Text>
            {user.bio ? (
              <Text size="sm">
                <strong>О себе:</strong> {user.bio}
              </Text>
            ) : null}
          </Stack>
        </AdminCard>
      </Tabs.Panel>
      <Tabs.Panel value="chat" pt="lg">
        <ModerationChatTab user={user} />
      </Tabs.Panel>
      <Tabs.Panel value="comments" pt="lg">
        <UserCommentsTab userId={user.id} variant="moderation" />
      </Tabs.Panel>
    </Tabs>
  )
}
