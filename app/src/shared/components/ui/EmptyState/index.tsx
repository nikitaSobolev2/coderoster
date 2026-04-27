import type { ReactNode } from 'react'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInbox } from '@fortawesome/free-solid-svg-icons'
import styles from './styles.module.scss'

export interface Props {
  title: string
  hint?: string
  icon?: IconDefinition
  cta?: ReactNode
  className?: string
}

/**
 * Editorial empty placeholder shared across platform pages. Gives content-less
 * sections a polished frosted card with a clear next action.
 */
export default function EmptyState({ title, hint, icon = faInbox, cta, className }: Props) {
  return (
    <div className={`${styles.empty} ${className ?? ''}`.trim()} role="status">
      <div className={styles.empty__iconWrap} aria-hidden="true">
        <FontAwesomeIcon icon={icon} className={styles.empty__icon} />
      </div>
      <h3 className={styles.empty__title}>{title}</h3>
      {hint ? <p className={styles.empty__hint}>{hint}</p> : null}
      {cta ? <div className={styles.empty__cta}>{cta}</div> : null}
    </div>
  )
}
