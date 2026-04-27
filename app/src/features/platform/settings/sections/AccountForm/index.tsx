import { Button, TextInput } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightFromBracket, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import type { UserSettings } from '~/server/repositories/types'
import styles from './styles.module.scss'

export interface Props {
  initial: UserSettings
}

export default function AccountForm({ initial }: Props) {
  return (
    <div className={styles.form}>
      <TextInput
        label="Email"
        value={initial.email}
        readOnly
        description="Используется для входа через WorkOS. Изменить email можно у провайдера."
      />

      <Button
        component="a"
        href="/account/logout"
        variant="default"
        leftSection={<FontAwesomeIcon icon={faArrowRightFromBracket} />}
      >
        Выйти из аккаунта
      </Button>

      <div className={styles.form__danger}>
        <FontAwesomeIcon icon={faTriangleExclamation} />
        <div className={styles.form__dangerBody}>
          <h4>Удалить аккаунт</h4>
          <p>Сотрёт прогресс, комментарии и достижения. Откатить нельзя.</p>
          <Button color="red" variant="light" disabled>
            Скоро
          </Button>
        </div>
      </div>
    </div>
  )
}
