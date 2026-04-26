'use client'

import { useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useCursorOutlineTarget } from '~/features/home/hooks/useCursorOutlineTarget'
import styles from './styles.module.scss'

export interface Props {
  open: boolean
  controlsId: string
  onToggle: () => void
  className?: string
}

export default function IslandMenuButton({ open, controlsId, onToggle, className = '' }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  useCursorOutlineTarget(ref)

  return (
    <button
      ref={ref}
      type="button"
      className={`${styles.menuButton} ${className}`}
      aria-expanded={open}
      aria-controls={controlsId}
      aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
      data-mobile-menu-burger
      onClick={onToggle}
    >
      <span
        className={`${styles.menuButton__icon} ${!open ? styles.menuButton__icon_visible : ''}`}
        aria-hidden
      >
        <FontAwesomeIcon icon={faBars} size="lg" />
      </span>
      <span
        className={`${styles.menuButton__icon} ${open ? styles.menuButton__icon_visible : ''}`}
        aria-hidden
      >
        <FontAwesomeIcon icon={faXmark} size="lg" />
      </span>
    </button>
  )
}
