import { Button, Badge, TextInput } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRightFromBracket,
  faCalendar,
  faCircleCheck,
  faShieldHalved
} from '@fortawesome/free-solid-svg-icons'
import type { UserSettings } from '~/server/repositories/types'
import styles from './styles.module.scss'

export interface Props {
  initial: UserSettings
}

const ROLE_LABEL: Record<UserSettings['role'], string> = {
  learner: 'Учащийся',
  author: 'Автор',
  moderator: 'Модератор',
  admin: 'Администратор'
}

export default function AccountCard({ initial }: Props) {
  return (
    <div className={styles.card}>
      <TextInput
        label="Email"
        value={initial.email}
        readOnly
        leftSection={<FontAwesomeIcon icon={faShieldHalved} />}
        description="Управляется через WorkOS. Сменить email можно у провайдера авторизации."
      />

      <ul className={styles.card__list}>
        <li>
          <span className={styles.card__listLabel}>
            <FontAwesomeIcon icon={faCalendar} /> Регистрация
          </span>
          <span className={styles.card__listValue}>{formatDate(initial.joinedAt)}</span>
        </li>
        <li>
          <span className={styles.card__listLabel}>
            <FontAwesomeIcon icon={faCircleCheck} /> Роль
          </span>
          <Badge color="grape" variant="light">
            {ROLE_LABEL[initial.role]}
          </Badge>
        </li>
      </ul>

      <Button
        component="a"
        href="/account/logout"
        variant="default"
        leftSection={<FontAwesomeIcon icon={faArrowRightFromBracket} />}
      >
        Выйти из аккаунта
      </Button>

      {initial.deletionRequestedAt ? (
        <div className={styles.card__pending} role="status">
          Запрос на удаление отправлен {formatDate(initial.deletionRequestedAt)}. Окончательная
          очистка произойдёт в течение часа.
        </div>
      ) : null}
    </div>
  )
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(value)
}
