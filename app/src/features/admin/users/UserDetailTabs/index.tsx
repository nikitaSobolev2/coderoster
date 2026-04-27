'use client'

import { Tabs } from '@mantine/core'
import type { RouterOutputs } from '~/trpc/react'
import UserProfileTab from './tabs/UserProfileTab'
import UserRoleBanTab from './tabs/UserRoleBanTab'
import UserAchievementsTab from './tabs/UserAchievementsTab'
import UserActivityTab from './tabs/UserActivityTab'
import UserCommentsTab from './tabs/UserCommentsTab'

export type AdminUserDetail = RouterOutputs['admin']['users']['get']

export interface Props {
  initialUser: AdminUserDetail
}

/**
 * Mantine vertical tabs hosting all per-user admin actions. Each tab is
 * isolated in its own file so the surface stays Single-Responsibility.
 */
export default function UserDetailTabs({ initialUser }: Props) {
  return (
    <Tabs defaultValue="profile" keepMounted={false}>
      <Tabs.List>
        <Tabs.Tab value="profile">Профиль</Tabs.Tab>
        <Tabs.Tab value="role">Роль и бан</Tabs.Tab>
        <Tabs.Tab value="achievements">Достижения</Tabs.Tab>
        <Tabs.Tab value="activity">Активность</Tabs.Tab>
        <Tabs.Tab value="comments">Комментарии</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="profile" pt="lg">
        <UserProfileTab user={initialUser} />
      </Tabs.Panel>
      <Tabs.Panel value="role" pt="lg">
        <UserRoleBanTab user={initialUser} />
      </Tabs.Panel>
      <Tabs.Panel value="achievements" pt="lg">
        <UserAchievementsTab userId={initialUser.id} />
      </Tabs.Panel>
      <Tabs.Panel value="activity" pt="lg">
        <UserActivityTab userId={initialUser.id} />
      </Tabs.Panel>
      <Tabs.Panel value="comments" pt="lg">
        <UserCommentsTab userId={initialUser.id} />
      </Tabs.Panel>
    </Tabs>
  )
}
