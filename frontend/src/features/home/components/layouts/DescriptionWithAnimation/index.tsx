'use client'

import { useCallback, useRef } from 'react'
import { useCursorArrowToTarget } from '~/features/home/hooks/useCursorArrowToTarget'
import styles from './styles.module.scss'

export interface Props {
  emoji: string
  description: string
  children?: React.ReactNode
  className?: string
}

export default function DescriptionWithAnimation({
  children,
  className,
  emoji,
  description
}: Props) {
  const ref = useRef<HTMLLIElement>(null)

  const onCursorFocus = useCallback(() => {
    console.log('cursor focus')
  }, [])

  // useCursorArrowToTarget(ref)

  return (
    <li className={`${styles.descriptionWithAnimation} ${className}`} ref={ref}>
      <span className={styles.descriptionWithAnimation__emoji}>{emoji}</span>
      <p className={styles.descriptionWithAnimation__text}>{description}</p>
      <div className={styles.descriptionWithAnimation__animation}>
        <div className={styles.descriptionWithAnimation__animation__container}>{children}</div>
      </div>
    </li>
  )
}
