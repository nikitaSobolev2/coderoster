'use client'

import { useState } from 'react'
import { Button, SegmentedControl } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import type { UserSettings } from '~/server/repositories/types'
import styles from './styles.module.scss'

export interface Props {
  initial: UserSettings
}

export default function AppearanceForm({ initial }: Props) {
  const [scheme, setScheme] = useState<UserSettings['appearance']['colorScheme']>(
    initial.appearance.colorScheme
  )
  const utils = api.useUtils()
  const update = api.settings.update.useMutation({
    onSuccess: next => {
      utils.settings.getMine.setData(undefined, next)
      notifications.show({ color: 'green', message: 'Тема сохранена.' })
    }
  })

  return (
    <form
      className={styles.form}
      onSubmit={event => {
        event.preventDefault()
        update.mutate({ appearance: { colorScheme: scheme } })
      }}
    >
      <div>
        <span className={styles.form__label}>Цветовая схема</span>
        <SegmentedControl
          value={scheme}
          onChange={value => setScheme(value as typeof scheme)}
          data={[
            { value: 'dark', label: 'Тёмная' },
            { value: 'light', label: 'Светлая' }
          ]}
        />
        <p className={styles.form__hint}>
          Светлая тема в разработке — пока всё рендерится в тёмной по умолчанию.
        </p>
      </div>

      <div className={styles.form__actions}>
        <Button type="submit" loading={update.isPending}>
          Сохранить
        </Button>
      </div>
    </form>
  )
}
