'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { faArrowRightToBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCursorFillTarget } from '~/features/home/hooks/useCursorFillTarget'
import styles from './styles.module.scss'

export interface Props {
  className?: string
  href?: string
  fullLabel?: string
  shortLabel?: string
}

export default function IslandCta({
  className = '',
  href = '/login',
  fullLabel = 'Начать сейчас',
  shortLabel = 'Начать'
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null)
  useCursorFillTarget(ref)

  return (
    <Link href={href} className={`${styles.cta} ${className}`} ref={ref} aria-label={fullLabel}>
      <span className={styles.cta__labelFull}>{fullLabel}</span>
      <span className={styles.cta__labelShort} aria-hidden>
        {shortLabel}
      </span>
      <FontAwesomeIcon icon={faArrowRightToBracket} className={styles.cta__icon} aria-hidden />
    </Link>
  )
}
