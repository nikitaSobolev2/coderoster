'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Modal, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import type { UserSettings } from '~/server/repositories/types'
import styles from './styles.module.scss'

export interface Props {
  initial: UserSettings
}

/**
 * Two-step destructive action: opens a modal that requires the user to type
 * their own username before submitting. The mutation enqueues the deletion
 * via `account.requestDeletion` and the broker consumer performs the cascade.
 */
export default function DangerCard({ initial }: Props) {
  const router = useRouter()
  const [opened, setOpened] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const isPending = Boolean(initial.deletionRequestedAt)
  const requestDeletion = api.account.requestDeletion.useMutation({
    onSuccess: () => {
      notifications.show({
        color: 'orange',
        title: 'Запрос принят',
        message: 'Аккаунт скоро будет удалён. Сейчас перенаправим на выход.'
      })
      router.push('/account/logout')
    },
    onError: err => {
      setError(err.message)
    }
  })

  function close() {
    setOpened(false)
    setConfirm('')
    setError(null)
  }

  return (
    <div className={styles.card}>
      <div className={styles.card__warn}>
        <FontAwesomeIcon icon={faTriangleExclamation} />
        <div>
          <h3>Удаление аккаунта</h3>
          <p>
            Сотрёт прогресс по курсам, ачивки, комментарии и историю активности. Действие
            необратимо. Данные удалит фоновая задача после подтверждения.
          </p>
        </div>
      </div>

      <div className={styles.card__actions}>
        <Button color="red" variant="light" disabled={isPending} onClick={() => setOpened(true)}>
          {isPending ? 'Удаление в процессе…' : 'Удалить аккаунт'}
        </Button>
      </div>

      <Modal
        opened={opened}
        onClose={close}
        title="Точно удалить аккаунт?"
        centered
        withCloseButton
        radius="md"
      >
        <p className={styles.card__modalCopy}>
          Чтобы подтвердить, введите свой никнейм <strong>@{initial.username}</strong>. Действие
          нельзя отменить.
        </p>
        <TextInput
          value={confirm}
          onChange={event => {
            setConfirm(event.currentTarget.value)
            setError(null)
          }}
          placeholder={`@${initial.username}`}
          label="Подтверждение"
          autoFocus
          error={error}
        />
        <div className={styles.card__modalActions}>
          <Button variant="default" onClick={close}>
            Отмена
          </Button>
          <Button
            color="red"
            loading={requestDeletion.isPending}
            disabled={confirm.replace(/^@/, '').toLowerCase() !== initial.username.toLowerCase()}
            onClick={() => {
              const cleaned = confirm.replace(/^@/, '')
              requestDeletion.mutate({ confirmUsername: cleaned })
            }}
          >
            Удалить навсегда
          </Button>
        </div>
      </Modal>
    </div>
  )
}
