'use client'

import { useRef } from 'react'
import styles from './styles.module.scss'
import PureButton from '~/shared/components/ui/buttons/PureButton'
import { useCursorFillTarget } from '~/features/home/hooks/useCursorFillTarget'
import { useHomeNavHrefActive } from '~/features/home/lib/homeNavHrefActive'

export interface Props {
  className?: string
  children?: React.ReactNode
  href?: string
}

export default function NavMenuItem({ className = '', children = null, href = '' }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isActive = useHomeNavHrefActive(href)

  useCursorFillTarget(buttonRef)

  return (
    <li
      className={`${styles.navMenuItem} ${className} ${isActive ? styles.navMenuItem_active : ''}`}
    >
      <PureButton className={styles.navMenuItem__button} href={href} ref={buttonRef}>
        {children}
      </PureButton>
    </li>
  )
}
