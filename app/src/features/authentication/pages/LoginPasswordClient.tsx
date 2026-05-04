'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Anchor, Button, Divider, Group, PasswordInput, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import Link from 'next/link'

import AuthChrome from '~/features/authentication/components/AuthChrome'
import styles from '~/features/authentication/components/authChrome.module.scss'
import { passwordSchema } from '~/features/authentication/validation/schemas'

export interface LoginPasswordClientProps {
  email: string
}

export default function LoginPasswordClient({ email }: Readonly<LoginPasswordClientProps>) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const form = useForm({
    initialValues: {
      email,
      password: ''
    },
    validate: {
      password: value => {
        const r = passwordSchema.safeParse({ password: value })
        return r.success
          ? null
          : (r.error.flatten().fieldErrors.password?.[0] ?? 'Некорректный пароль')
      }
    }
  })

  async function submit(values: { email: string; password: string }) {
    setBusy(true)
    try {
      const res = await fetch('/api/auth/password/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: values.email.trim().toLowerCase(),
          password: values.password
        })
      })
      const data = (await res.json()) as {
        error?: string
        ok?: boolean
        redirectTo?: string
        next?: string
        nextPath?: string
      }
      if (!res.ok) {
        form.setErrors({ password: data.error ?? 'Не удалось войти' })
        return
      }
      if (data.redirectTo) {
        globalThis.location.assign(data.redirectTo)
        return
      }
      if (data.nextPath) {
        router.push(data.nextPath)
      }
    } finally {
      setBusy(false)
    }
  }

  async function sendMagic() {
    setBusy(true)
    try {
      const res = await fetch('/api/auth/magic-auth/send', {
        method: 'POST',
        credentials: 'include'
      })
      const data = (await res.json()) as { error?: string; nextPath?: string }
      if (!res.ok) {
        form.setErrors({ password: data.error ?? 'Не удалось отправить код' })
        return
      }
      if (data.nextPath) router.push(data.nextPath)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthChrome title="Вход" subtitle="Введи пароль или выбери другой способ." backHref="/login">
      <form onSubmit={form.onSubmit(submit)}>
        <Stack gap="lg">
          <TextInput label="Электронная почта" value={email} readOnly disabled size="lg" />

          <PasswordInput
            label="Пароль"
            placeholder="••••••••"
            required
            visibilityToggleButtonProps={{ 'aria-label': 'Показать пароль' }}
            size="lg"
            classNames={{ input: styles.inputMin }}
            {...form.getInputProps('password')}
          />

          <Group justify="space-between" gap="xs">
            <Anchor component={Link} href="/login/forgot-password" size="md" c="dimmed" lh={1.5}>
              Забыл пароль
            </Anchor>
          </Group>

          <Button type="submit" fullWidth size="lg" className={styles.btnPrimary} loading={busy}>
            Войти
          </Button>

          <Divider label="или" labelPosition="center" classNames={{ label: styles.dividerLabel }} />

          <Stack gap="sm">
            <Button
              type="button"
              variant="default"
              fullWidth
              size="lg"
              className={styles.btnGhost}
              loading={busy}
              onClick={sendMagic}
            >
              Продолжить с кодом из email
            </Button>
          </Stack>
        </Stack>
      </form>
    </AuthChrome>
  )
}
