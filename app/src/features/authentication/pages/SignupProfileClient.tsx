'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Anchor, Button, Checkbox, SimpleGrid, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import Link from 'next/link'

import AuthChrome from '~/features/authentication/components/AuthChrome'
import styles from '~/features/authentication/components/authChrome.module.scss'
import { signupProfileBodySchema } from '~/features/authentication/validation/schemas'

export interface SignupProfileClientProps {
  initialEmail?: string
}

export default function SignupProfileClient({
  initialEmail = ''
}: Readonly<SignupProfileClientProps>) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const form = useForm({
    initialValues: {
      email: initialEmail,
      firstName: '',
      lastName: '',
      acceptPersonalDataProcessing: false
    },
    validate: {
      email: value => {
        const r = signupProfileBodySchema.pick({ email: true }).safeParse({ email: value })
        return r.success ? null : (r.error.flatten().fieldErrors.email?.[0] ?? 'Некорректный email')
      },
      firstName: value => {
        const r = signupProfileBodySchema.pick({ firstName: true }).safeParse({ firstName: value })
        return r.success ? null : (r.error.flatten().fieldErrors.firstName?.[0] ?? 'Укажи имя')
      },
      lastName: value => {
        const r = signupProfileBodySchema.pick({ lastName: true }).safeParse({ lastName: value })
        return r.success ? null : (r.error.flatten().fieldErrors.lastName?.[0] ?? 'Укажи фамилию')
      },
      acceptPersonalDataProcessing: value =>
        value === true ? null : 'Нужно согласие на обработку персональных данных'
    }
  })

  async function submit(values: typeof form.values) {
    setBusy(true)
    try {
      const res = await fetch('/api/auth/signup/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: values.email.trim().toLowerCase(),
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          acceptPersonalDataProcessing: values.acceptPersonalDataProcessing
        })
      })
      const data = (await res.json()) as { error?: string; nextPath?: string; details?: unknown }
      if (!res.ok) {
        form.setErrors({ email: typeof data.error === 'string' ? data.error : 'Проверь поля' })
        return
      }
      if (data.nextPath) router.push(data.nextPath)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthChrome
      title="Регистрация"
      subtitle="Шаг 1 из 3 — базовые данные профиля."
      backHref="/login"
    >
      <form onSubmit={form.onSubmit(submit)}>
        <Stack gap="md">
          <TextInput
            label="Электронная почта"
            type="email"
            autoComplete="email"
            required
            size="md"
            classNames={{ input: styles.inputMin }}
            {...form.getInputProps('email')}
          />
          <SimpleGrid cols={2} spacing="md">
            <TextInput
              label="Имя"
              autoComplete="given-name"
              required
              size="md"
              classNames={{ input: styles.inputMin }}
              {...form.getInputProps('firstName')}
            />
            <TextInput
              label="Фамилия"
              autoComplete="family-name"
              required
              size="md"
              classNames={{ input: styles.inputMin }}
              {...form.getInputProps('lastName')}
            />
          </SimpleGrid>
          <Checkbox
            label="Я согласен на обработку персональных данных"
            {...form.getInputProps('acceptPersonalDataProcessing', { type: 'checkbox' })}
          />
          <Button type="submit" fullWidth size="lg" className={styles.btnPrimary} loading={busy}>
            Продолжить
          </Button>
          <Anchor component={Link} href="/login" size="sm" c="dimmed" ta="center" display="block">
            Уже есть аккаунт? Войти
          </Anchor>
        </Stack>
      </form>
    </AuthChrome>
  )
}
