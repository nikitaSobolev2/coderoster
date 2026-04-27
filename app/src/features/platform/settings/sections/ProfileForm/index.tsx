'use client'

import { useState } from 'react'
import { Button, Textarea, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import type { UserSettings } from '~/server/repositories/types'
import styles from './styles.module.scss'

export interface Props {
  initial: UserSettings
}

interface FormState {
  displayName: string
  username: string
  bio: string
  avatarUrl: string
}

const USERNAME_PATTERN = /^[a-z0-9_]{2,40}$/i

export default function ProfileForm({ initial }: Props) {
  const [state, setState] = useState<FormState>(toFormState(initial))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const utils = api.useUtils()
  const update = api.settings.update.useMutation({
    onSuccess: next => {
      utils.settings.getMine.setData(undefined, next)
      notifications.show({ color: 'green', message: 'Профиль обновлён.' })
    }
  })

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!state.displayName.trim()) next.displayName = 'Не должно быть пустым'
    if (!USERNAME_PATTERN.test(state.username)) {
      next.username = 'Только латиница, цифры, подчёркивание (2–40)'
    }
    if (state.bio.length > 400) next.bio = 'Максимум 400 символов'
    if (state.avatarUrl && !/^https?:\/\//.test(state.avatarUrl)) {
      next.avatarUrl = 'Должна быть ссылка с http(s)'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return
    update.mutate({
      displayName: state.displayName.trim(),
      username: state.username.trim(),
      bio: state.bio.trim(),
      avatarUrl: state.avatarUrl.trim() === '' ? null : state.avatarUrl.trim()
    })
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <TextInput
        label="Имя"
        value={state.displayName}
        onChange={event => patch('displayName', event.currentTarget.value)}
        error={errors.displayName}
        required
        maxLength={80}
      />
      <TextInput
        label="Никнейм"
        leftSection="@"
        value={state.username}
        onChange={event => patch('username', event.currentTarget.value)}
        error={errors.username}
        required
        maxLength={40}
      />
      <Textarea
        label="Био"
        value={state.bio}
        onChange={event => patch('bio', event.currentTarget.value)}
        error={errors.bio}
        autosize
        minRows={3}
        maxRows={6}
        maxLength={400}
        description={`${state.bio.length} / 400`}
      />
      <TextInput
        label="Ссылка на аватар"
        value={state.avatarUrl}
        onChange={event => patch('avatarUrl', event.currentTarget.value)}
        error={errors.avatarUrl}
        placeholder="https://…"
      />
      <div className={styles.form__actions}>
        <Button type="submit" loading={update.isPending}>
          Сохранить
        </Button>
      </div>
    </form>
  )
}

function toFormState(settings: UserSettings): FormState {
  return {
    displayName: settings.displayName,
    username: settings.username,
    bio: settings.bio,
    avatarUrl: settings.avatarUrl ?? ''
  }
}
