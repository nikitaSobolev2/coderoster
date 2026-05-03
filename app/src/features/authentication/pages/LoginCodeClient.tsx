'use client'

import { useState } from 'react'
import { Button, PinInput, Stack, Text } from '@mantine/core'

import AuthChrome from '~/features/authentication/components/AuthChrome'
import AuthResendCodeButton from '~/features/authentication/components/AuthResendCodeButton'
import styles from '~/features/authentication/components/authChrome.module.scss'

export interface LoginCodeClientProps {
  email: string
  mode: 'magic' | 'email_verify'
}

export default function LoginCodeClient({ email, mode }: Readonly<LoginCodeClientProps>) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(nextCode: string) {
    if (nextCode.length !== 6) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/magic-auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: nextCode })
      })
      const data = (await res.json()) as { error?: string; redirectTo?: string }
      if (!res.ok) {
        setError(data.error ?? 'Неверный код')
        return
      }
      if (data.redirectTo) {
        globalThis.location.assign(data.redirectTo)
      }
    } finally {
      setBusy(false)
    }
  }

  const subtitle =
    mode === 'magic'
      ? `Мы отправили код на ${email}. Введи 6 цифр.`
      : `Подтверди почту ${email}. Введи код из письма.`

  return (
    <AuthChrome title="Проверь почту" subtitle={subtitle} backHref="/login/password">
      <Stack gap="md" align="center">
        <PinInput
          length={6}
          type="number"
          size="lg"
          value={code}
          onChange={value => {
            setCode(value)
            setError(null)
            if (value.length === 6) void submit(value)
          }}
          error={Boolean(error)}
          ariaLabel="Код из email"
        />
        {error ? (
          <Text size="sm" c="red" ta="center">
            {error}
          </Text>
        ) : null}
        {mode === 'magic' ? (
          <AuthResendCodeButton
            endpoint="/api/auth/magic-auth/send"
            initialCooldownSeconds={60}
            onResendTriggered={() => {
              setCode('')
              setError(null)
            }}
          />
        ) : (
          <Text size="sm" c="dimmed" ta="center">
            Письмо отправлено при входе. Проверь спам или вернись назад и попробуй снова.
          </Text>
        )}
        <Button
          variant="default"
          fullWidth
          className={styles.btnGhost}
          loading={busy}
          disabled={code.length !== 6}
          onClick={() => void submit(code)}
        >
          Продолжить
        </Button>
      </Stack>
    </AuthChrome>
  )
}
