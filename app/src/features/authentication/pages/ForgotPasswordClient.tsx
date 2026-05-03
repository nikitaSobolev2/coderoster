'use client'

import { useState } from 'react'
import { Button, Stack, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import Link from 'next/link'

import AuthChrome from '~/features/authentication/components/AuthChrome'
import styles from '~/features/authentication/components/authChrome.module.scss'
import { emailSchema } from '~/features/authentication/validation/schemas'

export default function ForgotPasswordClient() {
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm({
    initialValues: { email: '' },
    validate: {
      email: value => {
        const r = emailSchema.safeParse({ email: value })
        return r.success ? null : (r.error.flatten().fieldErrors.email?.[0] ?? 'Некорректный email')
      }
    }
  })

  async function submit(values: { email: string }) {
    setBusy(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: values.email.trim().toLowerCase() })
      })

      let data: { ok?: boolean; error?: string } = {}
      try {
        data = (await res.json()) as { ok?: boolean; error?: string }
      } catch {
        setSubmitError('Сервер вернул некорректный ответ')
        return
      }

      if (!res.ok) {
        setSubmitError(data.error ?? 'Не удалось отправить запрос')
        return
      }

      setSent(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthChrome
      title="Сброс пароля"
      subtitle="Отправим ссылку на почту, если аккаунт есть."
      backHref="/login"
    >
      {sent ? (
        <Stack gap="md">
          <Text size="sm">
            Если этот адрес привязан к аккаунту, проверь почту: мы отправили ссылку для сброса
            пароля. Письмо может попасть в «Спам».
          </Text>
          <Button component={Link} href="/login" fullWidth className={styles.btnPrimary}>
            На страницу входа
          </Button>
        </Stack>
      ) : (
        <form onSubmit={form.onSubmit(submit)}>
          <Stack gap="md">
            {submitError ? (
              <Text size="sm" c="red">
                {submitError}
              </Text>
            ) : null}
            <TextInput
              label="Электронная почта"
              type="email"
              autoComplete="email"
              required
              size="md"
              classNames={{ input: styles.inputMin }}
              {...form.getInputProps('email')}
            />
            <Button type="submit" fullWidth className={styles.btnPrimary} loading={busy}>
              Отправить инструкции
            </Button>
          </Stack>
        </form>
      )}
    </AuthChrome>
  )
}
