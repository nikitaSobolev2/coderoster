'use client'

import { useState } from 'react'
import { Button, NativeSelect, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import type { UserRole, UserSettings } from '~/server/repositories/types'
import { PLATFORM_ROLE_LABEL, PLATFORM_ROLE_OPTIONS } from '../../platformRoleLabels'
import styles from './BootstrapRolePicker.module.scss'

export interface Props {
  readonly settings: UserSettings
}

export default function BootstrapRolePicker({ settings }: Props) {
  const [role, setRole] = useState<UserRole>(settings.role)

  const utils = api.useUtils()
  const mutation = api.settings.updateBootstrapSelfRole.useMutation({
    onSuccess: async next => {
      utils.settings.getMine.setData(undefined, next)
      await utils.settings.getMine.refetch()
      notifications.show({ color: 'green', message: 'Роль обновлена.' })
    },
    onError: error => {
      notifications.show({ color: 'red', message: error.message })
    }
  })

  const dirty = role !== settings.role

  return (
    <div className={styles.panel}>
      <Text size="sm" className={styles.panel__hint}>
        Песочница для аккаунта из <code className={styles.panel__code}>ADMIN_BOOTSTRAP_EMAIL</code>:
        меняет только поле роли в базе платформы (WorkOS не затрагивается).
      </Text>
      <NativeSelect
        label="Платформенная роль"
        description="После сохранения перезапросятся права в этом браузере при следующих действиях."
        value={role}
        onChange={event => setRole(event.currentTarget.value as UserRole)}
        data={PLATFORM_ROLE_OPTIONS}
        classNames={{ input: styles.panel__select }}
      />
      <Button
        type="button"
        variant="default"
        className={styles.panel__submit}
        disabled={!dirty || mutation.isPending}
        loading={mutation.isPending}
        onClick={() => mutation.mutate({ role })}
      >
        Сохранить роль
      </Button>
      <Text size="xs" className={styles.panel__footnote}>
        Текущая метка: <strong>{PLATFORM_ROLE_LABEL[settings.role]}</strong>
      </Text>
    </div>
  )
}
