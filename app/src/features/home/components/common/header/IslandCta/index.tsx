'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { faArrowRightToBracket } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCursorFillTarget } from '~/features/home/hooks/useCursorFillTarget'
import styles from './styles.module.scss'

export interface Props {
  className?: string
  href?: string
  fullLabel?: string
  shortLabel?: string
  icon?: IconDefinition
}

export default function IslandCta({
  className = '',
  href = '/login',
  fullLabel = 'Начать сейчас',
  shortLabel = 'Начать',
  icon = faArrowRightToBracket
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null)
  useCursorFillTarget(ref)

  const isLogin = typeof href === 'string' && href.split(/[?#]/, 1)[0] === '/login'

  return (
    <Link
      href={href}
      prefetch={isLogin ? false : undefined}
      className={`${styles.cta} ${className}`}
      ref={ref}
      aria-label={fullLabel}
    >
      <span className={styles.cta__labelFull}>{fullLabel}</span>
      <span className={styles.cta__labelShort} aria-hidden>
        {shortLabel}
      </span>
      <FontAwesomeIcon icon={icon} className={styles.cta__icon} aria-hidden />
    </Link>
  )
}
