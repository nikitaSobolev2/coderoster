'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, PasswordInput, Stack } from '@mantine/core'
import { useForm } from '@mantine/form'

import AuthChrome from '~/features/authentication/components/AuthChrome'
import styles from '~/features/authentication/components/authChrome.module.scss'

export interface ResetPasswordClientProps {
  initialToken: string
}

export default function ResetPasswordClient({ initialToken }: ResetPasswordClientProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const form = useForm({
    initialValues: {
      password: '',
      confirm: ''
    },
    validate: {
      password: value =>
        value.length >= 8 ? null : 'Минимум 8 символов',
      confirm: (value, values) => (value === values.password ? null : 'Пароли не совпадают')
    }
  })

  async function submit(values: { password: string }) {
    if (!initialToken) {
      form.setErrors({ password: 'Нужна действующая ссылка из письма' })
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/password-reset/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: initialToken, newPassword: values.password })
      })
      const data = (await res.json()) as { error?: string; ok?: boolean }
      if (!res.ok) {
        form.setErrors({ password: data.error ?? 'Не удалось сменить пароль' })
        return
      }
      router.push('/login')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthChrome title="Новый пароль" subtitle="Придумай новый пароль для аккаунта." backHref="/login">
      <form onSubmit={form.onSubmit(submit)}>
        <Stack gap="md">
          <PasswordInput
            label="Новый пароль"
            required
            visibilityToggleButtonProps={{ 'aria-label': 'Показать пароль' }}
            size="md"
            classNames={{ input: styles.inputMin }}
            {...form.getInputProps('password')}
          />
          <PasswordInput
            label="Повтори пароль"
            required
            visibilityToggleButtonProps={{ 'aria-label': 'Показать пароль' }}
            size="md"
            classNames={{ input: styles.inputMin }}
            {...form.getInputProps('confirm')}
          />
          <Button type="submit" fullWidth className={styles.btnPrimary} loading={busy}>
            Сохранить пароль
          </Button>
        </Stack>
      </form>
    </AuthChrome>
  )
}
