'use client'

import { useState } from 'react'
import { Button, TextInput } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub, faLinkedin, faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { faGlobe } from '@fortawesome/free-solid-svg-icons'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import type { UserSettings } from '~/server/repositories/types'
import styles from './styles.module.scss'

type Social = keyof UserSettings['socials']

const FIELDS: {
  key: Social
  label: string
  icon: Parameters<typeof FontAwesomeIcon>[0]['icon']
}[] = [
  { key: 'github', label: 'GitHub', icon: faGithub },
  { key: 'linkedin', label: 'LinkedIn', icon: faLinkedin },
  { key: 'x', label: 'X', icon: faXTwitter },
  { key: 'website', label: 'Сайт', icon: faGlobe }
]

export interface Props {
  initial: UserSettings
}

export default function SocialsForm({ initial }: Props) {
  const [state, setState] = useState<Record<Social, string>>(toState(initial))
  const [errors, setErrors] = useState<Partial<Record<Social, string>>>({})
  const utils = api.useUtils()
  const update = api.settings.update.useMutation({
    onSuccess: next => {
      utils.settings.getMine.setData(undefined, next)
      notifications.show({ color: 'green', message: 'Соцсети обновлены.' })
    }
  })

  function patch(key: Social, value: string) {
    setState(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const next: Partial<Record<Social, string>> = {}
    for (const field of FIELDS) {
      const value = state[field.key].trim()
      if (value && !/^https?:\/\//.test(value)) {
        next[field.key] = 'Должна быть ссылка с http(s)'
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return
    const socials: UserSettings['socials'] = {
      github: state.github.trim() || null,
      linkedin: state.linkedin.trim() || null,
      x: state.x.trim() || null,
      website: state.website.trim() || null
    }
    update.mutate({ socials })
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {FIELDS.map(field => (
        <TextInput
          key={field.key}
          label={field.label}
          leftSection={<FontAwesomeIcon icon={field.icon} />}
          value={state[field.key]}
          onChange={event => patch(field.key, event.currentTarget.value)}
          error={errors[field.key]}
          placeholder="https://…"
        />
      ))}
      <div className={styles.form__actions}>
        <Button type="submit" loading={update.isPending}>
          Сохранить
        </Button>
      </div>
    </form>
  )
}

function toState(settings: UserSettings): Record<Social, string> {
  return {
    github: settings.socials.github ?? '',
    linkedin: settings.socials.linkedin ?? '',
    x: settings.socials.x ?? '',
    website: settings.socials.website ?? ''
  }
}
