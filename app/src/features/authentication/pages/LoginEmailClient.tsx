'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Anchor, Button, Divider, Group, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import Link from 'next/link'

import AuthChrome from '~/features/authentication/components/AuthChrome'
import { OAuthIconRowSkeleton } from '~/features/authentication/components/AuthClientSkeletons'
import OAuthProviderIcon from '~/features/authentication/components/OAuthProviderIcon'
import styles from '~/features/authentication/components/authChrome.module.scss'
import { emailSchema } from '~/features/authentication/validation/schemas'

interface ProvidersPayload {
  hostedEntryPath: string
  providers: { key: string; label: string }[]
}

async function fetchProviders(): Promise<ProvidersPayload | null> {
  try {
    const res = await fetch('/api/auth/providers', { credentials: 'include' })
    if (!res.ok) return null
    return (await res.json()) as ProvidersPayload
  } catch {
    return null
  }
}

export default function LoginEmailClient() {
  const router = useRouter()
  const [providers, setProviders] = useState<ProvidersPayload | null>(null)
  const [providersReady, setProvidersReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void fetchProviders().then(data => {
      setProviders(data)
      setProvidersReady(true)
    })
  }, [])

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
    try {
      const res = await fetch('/api/auth/flow/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: values.email.trim().toLowerCase() })
      })
      const data = (await res.json()) as { error?: string; exists?: boolean; nextPath?: string }
      if (!res.ok) {
        form.setErrors({ email: data.error ?? 'Ошибка запроса' })
        return
      }
      if (data.nextPath) {
        router.push(data.nextPath)
      }
    } finally {
      setBusy(false)
    }
  }

  const hostedPath = providers?.hostedEntryPath ?? '/auth/workos/start'

  return (
    <AuthChrome
      title="Вход"
      subtitle="Укажи email для следующего шага или войди через один из сервисов ниже."
      backHref="/"
    >
      <form onSubmit={form.onSubmit(submit)}>
        <Stack gap="md">
          <TextInput
            label="Электронная почта"
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            required
            size="md"
            classNames={{ input: styles.inputMin }}
            {...form.getInputProps('email')}
          />

          <Button type="submit" fullWidth size="lg" className={styles.btnPrimary} loading={busy}>
            Продолжить
          </Button>

          <Divider label="или" labelPosition="center" classNames={{ label: styles.dividerLabel }} />

          {providersReady ? (
            <Group gap="md" justify="center" wrap="wrap" className={styles.oauthRow}>
              {(providers?.providers ?? []).map(p => (
                <Button
                  key={p.key}
                  component="a"
                  href={
                    form.values.email.trim()
                      ? `${hostedPath}?login_hint=${encodeURIComponent(form.values.email.trim().toLowerCase())}`
                      : hostedPath
                  }
                  variant="default"
                  className={`${styles.btnGhost} ${styles.oauthIconBtn}`}
                  aria-label={`Войти через ${p.label}`}
                >
                  <OAuthProviderIcon providerKey={p.key} />
                </Button>
              ))}
            </Group>
          ) : (
            <OAuthIconRowSkeleton />
          )}

          <Anchor component={Link} href="/signup" size="sm" c="dimmed" ta="center" display="block">
            Нет аккаунта? Регистрация
          </Anchor>
        </Stack>
      </form>
    </AuthChrome>
  )
}
