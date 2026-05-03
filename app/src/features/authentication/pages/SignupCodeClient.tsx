'use client'

import { useState } from 'react'
import { Button, PinInput, Stack, Text } from '@mantine/core'

import AuthChrome from '~/features/authentication/components/AuthChrome'
import AuthResendCodeButton from '~/features/authentication/components/AuthResendCodeButton'
import styles from '~/features/authentication/components/authChrome.module.scss'

export interface SignupCodeClientProps {
  email: string
}

export default function SignupCodeClient({ email }: Readonly<SignupCodeClientProps>) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(nextCode: string) {
    if (nextCode.length !== 6) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/signup/verify-magic', {
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
      if (data.redirectTo) globalThis.location.assign(data.redirectTo)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthChrome
      title="Проверь почту"
      subtitle={`Код отправлен на ${email}. Введи 6 цифр.`}
      backHref="/signup/password"
    >
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
        <AuthResendCodeButton
          endpoint="/api/auth/signup/send-magic"
          initialCooldownSeconds={60}
          onResendTriggered={() => {
            setCode('')
            setError(null)
          }}
        />
        <Button
          variant="default"
          fullWidth
          className={styles.btnGhost}
          loading={busy}
          disabled={code.length !== 6}
          onClick={() => void submit(code)}
        >
          Завершить регистрацию
        </Button>
      </Stack>
    </AuthChrome>
  )
}
