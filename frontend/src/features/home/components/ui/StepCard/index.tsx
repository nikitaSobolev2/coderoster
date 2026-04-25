'use client'

import { useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { useCursorArrowToTarget } from '~/features/home/hooks/useCursorArrowToTarget'
import styles from './styles.module.scss'

export interface Props {
  index: string
  icon: IconDefinition
  title: string
  description: string
  className?: string
}

export default function StepCard({ index, icon, title, description, className = '' }: Props) {
  const cardRef = useRef<HTMLLIElement>(null)
  useCursorArrowToTarget(cardRef)

  return (
    <li ref={cardRef} className={`${styles.step} ${className}`}>
      <div className={styles.step__rail}>
        <span className={styles.step__index}>{index}</span>
        <span className={styles.step__connector} aria-hidden="true" />
      </div>
      <div className={styles.step__body}>
        <span className={styles.step__icon}>
          <FontAwesomeIcon icon={icon} />
        </span>
        <h3 className={styles.step__title}>{title}</h3>
        <p className={styles.step__description}>{description}</p>
      </div>
    </li>
  )
}
