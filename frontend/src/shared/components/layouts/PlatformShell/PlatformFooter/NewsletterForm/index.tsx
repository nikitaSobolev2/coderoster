'use client'

import { useState } from 'react'
import styles from './styles.module.scss'

type Status = 'idle' | 'submitting' | 'success' | 'error'

/**
 * Lightweight email capture used in the platform footer. The actual transport
 * is not wired yet — we simulate optimistic acceptance after a short delay
 * and surface validation errors locally.
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isValidEmail(email)) {
      setStatus('error')
      return
    }
    setStatus('submitting')
    await new Promise(resolve => setTimeout(resolve, 600))
    setStatus('success')
    setEmail('')
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label className={styles.form__row}>
        <span className="visually-hidden">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={event => {
            setEmail(event.target.value)
            if (status !== 'idle') setStatus('idle')
          }}
          placeholder="email@example.com"
          className={styles.form__input}
        />
        <button type="submit" className={styles.form__submit} disabled={status === 'submitting'}>
          {status === 'submitting' ? '…' : 'OK'}
        </button>
      </label>
      {status === 'success' ? (
        <span className={styles.form__success}>Подписка оформлена.</span>
      ) : null}
      {status === 'error' ? (
        <span className={styles.form__error}>Похоже, email некорректный.</span>
      ) : null}
    </form>
  )
}

function isValidEmail(value: string): boolean {
  return /.+@.+\..+/.test(value)
}
