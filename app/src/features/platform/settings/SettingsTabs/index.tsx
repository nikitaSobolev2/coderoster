'use client'

import { Tabs } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faIdBadge, faKey, faLink, faPalette } from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import type { UserSettings } from '~/server/repositories/types'
import ProfileForm from '../sections/ProfileForm'
import AccountForm from '../sections/AccountForm'
import SocialsForm from '../sections/SocialsForm'
import AppearanceForm from '../sections/AppearanceForm'
import styles from './styles.module.scss'

export interface Props {
  initial: UserSettings
}

export default function SettingsTabs({ initial }: Props) {
  const { data } = api.settings.getMine.useQuery(undefined, { initialData: initial })
  const settings: UserSettings = data ?? initial

  return (
    <Tabs
      defaultValue="profile"
      orientation="vertical"
      classNames={{
        list: styles.tabs__list,
        tab: styles.tabs__tab,
        panel: styles.tabs__panel
      }}
    >
      <Tabs.List>
        <Tabs.Tab value="profile" leftSection={<FontAwesomeIcon icon={faIdBadge} />}>
          Профиль
        </Tabs.Tab>
        <Tabs.Tab value="account" leftSection={<FontAwesomeIcon icon={faKey} />}>
          Аккаунт
        </Tabs.Tab>
        <Tabs.Tab value="socials" leftSection={<FontAwesomeIcon icon={faLink} />}>
          Соцсети
        </Tabs.Tab>
        <Tabs.Tab value="appearance" leftSection={<FontAwesomeIcon icon={faPalette} />}>
          Внешний вид
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="profile">
        <ProfileForm initial={settings} />
      </Tabs.Panel>
      <Tabs.Panel value="account">
        <AccountForm initial={settings} />
      </Tabs.Panel>
      <Tabs.Panel value="socials">
        <SocialsForm initial={settings} />
      </Tabs.Panel>
      <Tabs.Panel value="appearance">
        <AppearanceForm initial={settings} />
      </Tabs.Panel>
    </Tabs>
  )
}
