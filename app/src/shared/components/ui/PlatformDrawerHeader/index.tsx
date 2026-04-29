'use client'

import clsx from 'clsx'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

import styles from './styles.module.scss'

export type Props = {
  title?: ReactNode
  /** When true, header content is right-aligned (title row omitted). */
  actionsOnly?: boolean
  onClose?: () => void
  closeAriaLabel?: string
  trailing?: ReactNode
} & Omit<ComponentPropsWithoutRef<'header'>, 'children'>

export default function PlatformDrawerHeader({
  title,
  actionsOnly = false,
  onClose,
  closeAriaLabel = 'Закрыть',
  trailing,
  className,
  ...rest
}: Readonly<Props>) {
  const showTitle = Boolean(title) && !actionsOnly

  return (
    <header
      className={clsx(styles.root, actionsOnly && styles.rootActionsOnly, className)}
      {...rest}
    >
      {showTitle ? <span className={styles.title}>{title}</span> : null}
      <div className={styles.trailing}>
        {trailing}
        {onClose ? (
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label={closeAriaLabel}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        ) : null}
      </div>
    </header>
  )
}
