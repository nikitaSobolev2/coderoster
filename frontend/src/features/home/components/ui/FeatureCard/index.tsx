'use client'

import { useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { useCursorOutlineTarget } from '~/features/home/hooks/useCursorOutlineTarget'
import styles from './styles.module.scss'

export interface Props {
  icon: IconDefinition
  title: string
  description: string
  comingSoon?: boolean
  className?: string
}

export default function FeatureCard({
  icon,
  title,
  description,
  comingSoon = false,
  className = ''
}: Props) {
  const cardRef = useRef<HTMLLIElement>(null)
  useCursorOutlineTarget(cardRef)

  return (
    <li ref={cardRef} className={`${styles.featureCard} ${className}`}>
      <span className={styles.featureCard__icon}>
        <FontAwesomeIcon icon={icon} />
      </span>
      {comingSoon && <span className={styles.featureCard__badge}>Скоро</span>}
      <h3 className={styles.featureCard__title}>{title}</h3>
      <p className={styles.featureCard__description}>{description}</p>
    </li>
  )
}
