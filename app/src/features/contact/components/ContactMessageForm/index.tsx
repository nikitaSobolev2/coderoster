'use client'

import { useRef, useState, type FormEvent } from 'react'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCursorFillTarget } from '~/features/home/hooks/useCursorFillTarget'
import { useCursorOutlineTarget } from '~/features/home/hooks/useCursorOutlineTarget'
import type { ContactPayloadInput } from '~/features/contact/contactPayloadSchema'
import { postContactMessage } from '~/features/contact/postContactMessage'
import homeStyles from './home.module.scss'
import platformStyles from './platform.module.scss'

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export interface ContactMessageFormProps {
  variant: 'home' | 'platform'
}

type PayloadState = Pick<ContactPayloadInput, 'name' | 'email' | 'message'>

const EMPTY: PayloadState = { name: '', email: '', message: '' }

export default function ContactMessageForm({ variant }: Readonly<ContactMessageFormProps>) {
  if (variant === 'home') {
    return <ContactMessageFormHome />
  }
  return <ContactMessageFormPlatform />
}

function ContactMessageFormHome() {
  const submitRef = useRef<HTMLButtonElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  useCursorFillTarget(submitRef)
  useCursorOutlineTarget(nameInputRef)
  useCursorOutlineTarget(emailInputRef)
  useCursorOutlineTarget(messageInputRef)

  const [payload, setPayload] = useState<PayloadState>(EMPTY)
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleChange =
    (field: keyof PayloadState) => (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
      setPayload(previous => ({ ...previous, [field]: value }))
    }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrorMessage(null)
    try {
      const response = await postContactMessage({ ...payload, source: 'home' })
      if (!response.ok) throw new Error(response.error ?? 'Не удалось отправить сообщение')
      setStatus('success')
      setPayload(EMPTY)
    } catch (caughtError) {
      setStatus('error')
      setErrorMessage(caughtError instanceof Error ? caughtError.message : 'Неизвестная ошибка')
    }
  }

  return (
    <form className={homeStyles.contactForm} onSubmit={handleSubmit} noValidate>
      <label className={homeStyles.contactForm__field}>
        <span className={homeStyles.contactForm__label}>Имя</span>
        <input
          ref={nameInputRef}
          className={homeStyles.contactForm__input}
          type="text"
          required
          placeholder=" "
          value={payload.name}
          onChange={handleChange('name')}
          autoComplete="name"
        />
      </label>
      <label className={homeStyles.contactForm__field}>
        <span className={homeStyles.contactForm__label}>Email</span>
        <input
          ref={emailInputRef}
          className={homeStyles.contactForm__input}
          type="email"
          required
          placeholder=" "
          value={payload.email}
          onChange={handleChange('email')}
          autoComplete="email"
        />
      </label>
      <label className={homeStyles.contactForm__field}>
        <span className={homeStyles.contactForm__label}>Сообщение</span>
        <textarea
          ref={messageInputRef}
          className={homeStyles.contactForm__textarea}
          required
          rows={4}
          placeholder=" "
          value={payload.message}
          onChange={handleChange('message')}
        />
      </label>
      <button ref={submitRef} className={homeStyles.contactForm__submit} type="submit" disabled={status === 'submitting'}>
        <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: 8 }} />
        {status === 'submitting' ? 'Отправляем…' : 'Отправить'}
      </button>
      {status === 'success' ? (
        <p className={homeStyles.contactForm__feedback_success}>Спасибо! Мы свяжемся с вами скоро.</p>
      ) : null}
      {status === 'error' && errorMessage ? (
        <p className={homeStyles.contactForm__feedback_error}>{errorMessage}</p>
      ) : null}
    </form>
  )
}

function ContactMessageFormPlatform() {
  const [payload, setPayload] = useState<PayloadState>(EMPTY)
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleChange =
    (field: keyof PayloadState) => (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
      setPayload(previous => ({ ...previous, [field]: value }))
    }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrorMessage(null)
    try {
      const response = await postContactMessage({ ...payload, source: 'platform' })
      if (!response.ok) throw new Error(response.error ?? 'Не удалось отправить сообщение')
      setStatus('success')
      setPayload(EMPTY)
    } catch (caughtError) {
      setStatus('error')
      setErrorMessage(caughtError instanceof Error ? caughtError.message : 'Неизвестная ошибка')
    }
  }

  return (
    <form className={platformStyles.form} onSubmit={handleSubmit} noValidate>
      <label className={platformStyles.field}>
        <span className={platformStyles.label}>Имя</span>
        <input
          className={platformStyles.input}
          type="text"
          required
          value={payload.name}
          onChange={handleChange('name')}
          autoComplete="name"
        />
      </label>
      <label className={platformStyles.field}>
        <span className={platformStyles.label}>Email</span>
        <input
          className={platformStyles.input}
          type="email"
          required
          value={payload.email}
          onChange={handleChange('email')}
          autoComplete="email"
        />
      </label>
      <label className={platformStyles.field}>
        <span className={platformStyles.label}>Сообщение</span>
        <textarea
          className={platformStyles.textarea}
          required
          rows={3}
          value={payload.message}
          onChange={handleChange('message')}
        />
      </label>
      <button className={platformStyles.submit} type="submit" disabled={status === 'submitting'}>
        <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: 6 }} />
        {status === 'submitting' ? 'Отправляем…' : 'Отправить'}
      </button>
      {status === 'success' ? <p className={platformStyles.success}>Спасибо! Мы свяжемся с вами скоро.</p> : null}
      {status === 'error' && errorMessage ? <p className={platformStyles.error}>{errorMessage}</p> : null}
    </form>
  )
}
