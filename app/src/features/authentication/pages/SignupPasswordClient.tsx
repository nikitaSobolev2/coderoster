'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Anchor, Button, Divider, PasswordInput, Stack, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import Link from 'next/link'

import AuthChrome from '~/features/authentication/components/AuthChrome'
import { HostedAuthKitButtonSkeleton } from '~/features/authentication/components/AuthClientSkeletons'
import styles from '~/features/authentication/components/authChrome.module.scss'
import { passwordSchema } from '~/features/authentication/validation/schemas'

export interface SignupPasswordClientProps {
  email: string
  firstName: string
  lastName: string
}

async function fetchProvidersEmailHint(): Promise<string> {
  try {
    const res = await fetch('/api/auth/providers', { credentials: 'include' })
    if (!res.ok) return ''
    const data = (await res.json()) as { hostedEntryPath?: string }
    return typeof data.hostedEntryPath === 'string' ? data.hostedEntryPath : ''
  } catch {
    return ''
  }
}

export default function SignupPasswordClient({
  email,
  firstName,
  lastName
}: Readonly<SignupPasswordClientProps>) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [hostedPathReady, setHostedPathReady] = useState(false)
  const [hostedPath, setHostedPath] = useState('/auth/workos/start')

  useEffect(() => {
    void fetchProvidersEmailHint().then(p => {
      if (p) setHostedPath(p)
      setHostedPathReady(true)
    })
  }, [])

  const form = useForm({
    initialValues: {
      password: '',
      confirm: ''
    },
    validate: {
      password: value => {
        const r = passwordSchema.safeParse({ password: value })
        return r.success
          ? null
          : (r.error.flatten().fieldErrors.password?.[0] ?? 'Некорректный пароль')
      },
      confirm: (value, values) => (value === values.password ? null : 'Пароли не совпадают')
    }
  })

  async function submitPassword(values: { password: string }) {
    setBusy(true)
    try {
      const res = await fetch('/api/auth/signup/complete-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password: values.password
        })
      })
      const data = (await res.json()) as { error?: string; redirectTo?: string }
      if (!res.ok) {
        form.setErrors({ password: data.error ?? 'Не удалось завершить регистрацию' })
        return
      }
      if (data.redirectTo) globalThis.location.assign(data.redirectTo)
    } finally {
      setBusy(false)
    }
  }

  async function sendMagic() {
    setBusy(true)
    try {
      const res = await fetch('/api/auth/signup/send-magic', {
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

  const oauthHref = `${hostedPath}?screen=sign-up&login_hint=${encodeURIComponent(email.trim().toLowerCase())}`

  return (
    <AuthChrome
      title="Регистрация"
      subtitle="Шаг 2 из 3 — пароль или код на почту."
      backHref="/signup"
    >
      <form onSubmit={form.onSubmit(values => void submitPassword(values))}>
        <Stack gap="md">
          <TextInput label="Электронная почта" value={email} readOnly disabled size="md" />
          <TextInput label="Имя" value={firstName} readOnly disabled size="md" />
          <TextInput label="Фамилия" value={lastName} readOnly disabled size="md" />

          <PasswordInput
            label="Пароль"
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

          <Button type="submit" fullWidth size="lg" className={styles.btnPrimary} loading={busy}>
            Создать аккаунт с паролем
          </Button>

          <Divider label="или" labelPosition="center" classNames={{ label: styles.dividerLabel }} />

          <Button
            type="button"
            variant="default"
            fullWidth
            size="lg"
            className={styles.btnGhost}
            loading={busy}
            onClick={() => void sendMagic()}
          >
            Продолжить с кодом из email
          </Button>

          <Anchor component={Link} href="/login" size="sm" c="dimmed" ta="center" display="block">
            Уже есть аккаунт? Войти
          </Anchor>
        </Stack>
      </form>
    </AuthChrome>
  )
}
