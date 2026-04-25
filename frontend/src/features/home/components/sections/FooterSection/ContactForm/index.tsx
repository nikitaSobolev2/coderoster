'use client'

import { useRef, useState, type FormEvent } from 'react'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCursorFillTarget } from '~/features/home/hooks/useCursorFillTarget'
import styles from './styles.module.scss'

const CONTACT_API_PATH = '/api/v1/contact'

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

interface ContactFormPayload {
  name: string
  email: string
  message: string
}

const EMPTY_PAYLOAD: ContactFormPayload = { name: '', email: '', message: '' }

export default function ContactForm() {
  const submitRef = useRef<HTMLButtonElement>(null)
  useCursorFillTarget(submitRef)

  const [payload, setPayload] = useState<ContactFormPayload>(EMPTY_PAYLOAD)
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleChange =
    (field: keyof ContactFormPayload) =>
    (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
      setPayload(previous => ({ ...previous, [field]: value }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'submitting') return

    setStatus('submitting')
    setErrorMessage(null)

    try {
      const response = await postContactRequest(payload)
      if (!response.ok) {
        throw new Error(response.error ?? 'Не удалось отправить сообщение')
      }
      setStatus('success')
      setPayload(EMPTY_PAYLOAD)
    } catch (caughtError) {
      setStatus('error')
      setErrorMessage(caughtError instanceof Error ? caughtError.message : 'Неизвестная ошибка')
    }
  }

  return (
    <form className={styles.contactForm} onSubmit={handleSubmit} noValidate>
      <label className={styles.contactForm__field}>
        <span className={styles.contactForm__label}>Имя</span>
        <input
          className={styles.contactForm__input}
          type="text"
          required
          placeholder=" "
          value={payload.name}
          onChange={handleChange('name')}
          autoComplete="name"
        />
      </label>
      <label className={styles.contactForm__field}>
        <span className={styles.contactForm__label}>Email</span>
        <input
          className={styles.contactForm__input}
          type="email"
          required
          placeholder=" "
          value={payload.email}
          onChange={handleChange('email')}
          autoComplete="email"
        />
      </label>
      <label className={styles.contactForm__field}>
        <span className={styles.contactForm__label}>Сообщение</span>
        <textarea
          className={styles.contactForm__textarea}
          required
          rows={4}
          placeholder=" "
          value={payload.message}
          onChange={handleChange('message')}
        />
      </label>
      <button
        ref={submitRef}
        className={styles.contactForm__submit}
        type="submit"
        disabled={status === 'submitting'}
      >
        <FontAwesomeIcon icon={faPaperPlane} />
        {status === 'submitting' ? 'Отправляем…' : 'Отправить'}
      </button>
      {status === 'success' && (
        <p className={styles.contactForm__feedback_success}>Спасибо! Мы свяжемся с вами скоро.</p>
      )}
      {status === 'error' && errorMessage && (
        <p className={styles.contactForm__feedback_error}>{errorMessage}</p>
      )}
    </form>
  )
}

interface ContactResponse {
  ok: boolean
  error?: string
}

async function postContactRequest(payload: ContactFormPayload): Promise<ContactResponse> {
  const response = await fetch(CONTACT_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    return { ok: false, error: `Ошибка ${response.status}` }
  }

  const data: unknown = await response.json().catch(() => ({}))
  return { ok: true, ...(data as Partial<ContactResponse>) }
}
