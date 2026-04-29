'use client'

import { useRef } from 'react'
import HomeTooltip from '~/shared/components/ui/HomeTooltip'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComments } from '@fortawesome/free-solid-svg-icons'

import { useCursorFillTarget } from '~/features/home/hooks/useCursorFillTarget'

import styles from './HomeLiveChatHeaderButton.module.scss'

export interface Props {
  onClick: () => void
  label?: string
  ariaLabel?: string
}

export default function HomeLiveChatHeaderButton({
  onClick,
  label = 'Живой чат',
  ariaLabel = 'Открыть живой чат'
}: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  useCursorFillTarget(ref)

  return (
    <HomeTooltip label={label}>
      <button
        type="button"
        className={styles.chatToggle}
        ref={ref}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        <FontAwesomeIcon icon={faComments} aria-hidden />
      </button>
    </HomeTooltip>
  )
}
