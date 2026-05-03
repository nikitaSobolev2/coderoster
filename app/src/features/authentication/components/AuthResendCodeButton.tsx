'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Text } from '@mantine/core'

import styles from '~/features/authentication/components/authChrome.module.scss'

export interface AuthResendCodeButtonProps {
  /** POST endpoint that triggers WorkOS to send a new code (magic auth). */
  endpoint: '/api/auth/magic-auth/send' | '/api/auth/signup/send-magic'
  /** Cooldown after landing on this step (code was just sent). */
  initialCooldownSeconds?: number
  /** Clears PIN / verification error when resend starts (new code supersedes prior attempt). */
  onResendTriggered?: () => void
}

function parseRetryAfterSeconds(res: Response, data: unknown): number | undefined {
  const header = res.headers.get('Retry-After')
  if (header) {
    const parsed = Number.parseInt(header, 10)
    if (!Number.isNaN(parsed) && parsed > 0) return parsed
  }
  if (typeof data === 'object' && data !== null) {
    const n = (data as { retryAfterSeconds?: unknown }).retryAfterSeconds
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) return Math.ceil(n)
  }
  return undefined
}

export default function AuthResendCodeButton({
  endpoint,
  initialCooldownSeconds = 60,
  onResendTriggered
}: Readonly<AuthResendCodeButtonProps>) {
  const [deadlineMs, setDeadlineMs] = useState(() => Date.now() + initialCooldownSeconds * 1000)
  const [secondsLeft, setSecondsLeft] = useState(initialCooldownSeconds)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000))
      setSecondsLeft(left)
    }
    tick()
    const id = globalThis.setInterval(tick, 1000)
    return () => globalThis.clearInterval(id)
  }, [deadlineMs])

  const startCooldown = useCallback((sec: number) => {
    setDeadlineMs(Date.now() + Math.max(1, Math.ceil(sec)) * 1000)
  }, [])

  const resend = useCallback(async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    onResendTriggered?.()
    try {
      const res = await fetch(endpoint, { method: 'POST', credentials: 'include' })
      const data = (await res.json()) as {
        error?: string
        retryAfterSeconds?: number
      }
      if (!res.ok) {
        const wait = parseRetryAfterSeconds(res, data)
        if (wait !== undefined) {
          startCooldown(wait)
        }
        setError(data.error ?? 'Не удалось отправить код')
        return
      }
      startCooldown(initialCooldownSeconds)
      setNotice('Код отправлен повторно — проверь почту.')
      globalThis.setTimeout(() => setNotice(null), 5000)
    } catch {
      setError('Сеть недоступна. Попробуй ещё раз.')
    } finally {
      setBusy(false)
    }
  }, [endpoint, initialCooldownSeconds, onResendTriggered, startCooldown])

  const blocked = secondsLeft > 0

  return (
    <>
      <Button
        type="button"
        variant="default"
        fullWidth
        className={styles.btnGhost}
        loading={busy}
        disabled={blocked}
        onClick={() => void resend()}
        aria-label={
          blocked
            ? `Отправить код повторно, доступно через ${secondsLeft} секунд`
            : 'Отправить код повторно'
        }
      >
        {blocked ? `Отправить снова (${secondsLeft} с)` : 'Отправить снова'}
      </Button>
      {error ? (
        <Text size="sm" c="red" ta="center">
          {error}
        </Text>
      ) : null}
      {notice ? (
        <Text size="sm" c="dimmed" ta="center">
          {notice}
        </Text>
      ) : null}
    </>
  )
}
