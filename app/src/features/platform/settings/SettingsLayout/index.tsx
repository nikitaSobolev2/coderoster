'use client'

import { useState, type ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown,
  faIdBadge,
  faKey,
  faLink,
  faPalette,
  faSkullCrossbones
} from '@fortawesome/free-solid-svg-icons'
import { api } from '~/trpc/react'
import type { UserSettings } from '~/server/repositories/types'
import ProfileCard from '../sections/ProfileCard'
import AccountCard from '../sections/AccountCard'
import SocialsCard from '../sections/SocialsCard'
import AppearanceCard from '../sections/AppearanceCard'
import DangerCard from '../sections/DangerCard'
import styles from './styles.module.scss'

export interface Props {
  initial: UserSettings
}

interface SectionConfig {
  id: 'profile' | 'account' | 'socials' | 'appearance' | 'danger'
  label: string
  description: string
  icon: typeof faIdBadge
  render(settings: UserSettings): ReactNode
}

const SECTIONS: SectionConfig[] = [
  {
    id: 'profile',
    label: 'Профиль',
    description: 'Имя, никнейм, био и аватар',
    icon: faIdBadge,
    render: settings => <ProfileCard initial={settings} />
  },
  {
    id: 'account',
    label: 'Аккаунт',
    description: 'Email, дата регистрации, выход',
    icon: faKey,
    render: settings => <AccountCard initial={settings} />
  },
  {
    id: 'socials',
    label: 'Соцсети',
    description: 'Ссылки на твои аккаунты и сайт',
    icon: faLink,
    render: settings => <SocialsCard initial={settings} />
  },
  {
    id: 'appearance',
    label: 'Внешний вид',
    description: 'Тема и плотность интерфейса',
    icon: faPalette,
    render: settings => <AppearanceCard initial={settings} />
  },
  {
    id: 'danger',
    label: 'Опасная зона',
    description: 'Удаление аккаунта без возврата',
    icon: faSkullCrossbones,
    render: settings => <DangerCard initial={settings} />
  }
]

export default function SettingsLayout({ initial }: Props) {
  const { data } = api.settings.getMine.useQuery(undefined, { initialData: initial })
  const settings: UserSettings = data ?? initial
  const [activeId, setActiveId] = useState<SectionConfig['id']>('profile')
  const active = SECTIONS.find(section => section.id === activeId) ?? SECTIONS[0]!

  return (
    <div className={styles.layout}>
      <aside className={styles.layout__sidebar} aria-label="Разделы настроек">
        <ul className={styles.layout__list}>
          {SECTIONS.map(section => {
            const isActive = section.id === active.id
            return (
              <li key={section.id}>
                <button
                  type="button"
                  className={`${styles.layout__navItem} ${
                    isActive ? styles['layout__navItem--active'] : ''
                  }`}
                  onClick={() => setActiveId(section.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={styles.layout__navIcon} aria-hidden="true">
                    <FontAwesomeIcon icon={section.icon} />
                  </span>
                  <span className={styles.layout__navText}>
                    <span className={styles.layout__navLabel}>{section.label}</span>
                    <span className={styles.layout__navDesc}>{section.description}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <details className={styles.layout__mobileSwitcher}>
        <summary className={styles.layout__mobileSummary}>
          <span className={styles.layout__navIcon} aria-hidden="true">
            <FontAwesomeIcon icon={active.icon} />
          </span>
          <span className={styles.layout__navText}>
            <span className={styles.layout__navLabel}>{active.label}</span>
            <span className={styles.layout__navDesc}>{active.description}</span>
          </span>
          <FontAwesomeIcon icon={faChevronDown} className={styles.layout__chevron} />
        </summary>
        <ul className={styles.layout__mobileList}>
          {SECTIONS.map(section => (
            <li key={section.id}>
              <button
                type="button"
                className={styles.layout__mobileItem}
                onClick={() => setActiveId(section.id)}
              >
                <FontAwesomeIcon icon={section.icon} />
                <span>{section.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </details>

      <section className={styles.layout__content} aria-live="polite">
        <header className={styles.layout__contentHead}>
          <h2 className={styles.layout__contentTitle}>{active.label}</h2>
          <p className={styles.layout__contentCopy}>{active.description}</p>
        </header>
        <div className={styles.layout__contentBody}>{active.render(settings)}</div>
      </section>
    </div>
  )
}
