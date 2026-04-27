'use client'

import { spotlight } from '@mantine/spotlight'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import KeyboardBadge from '~/shared/components/ui/KeyboardBadge'
import styles from './styles.module.scss'

export interface Props {
  className?: string
}

export default function SearchTrigger({ className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={() => spotlight.open()}
      className={`${styles.trigger} ${className}`.trim()}
      aria-label="Открыть поиск по платформе"
    >
      <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.trigger__icon} />
      <span className={styles.trigger__label}>Поиск</span>
      <KeyboardBadge keys="/" className={styles.trigger__badge} />
    </button>
  )
}
