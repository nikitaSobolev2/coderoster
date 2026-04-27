'use client'

import { useRef } from 'react'
import styles from './styles.module.scss'
import PureButton from '~/shared/components/ui/buttons/PureButton'
import { useCursorFillTarget } from '~/features/home/hooks/useCursorFillTarget'
import { useSectionScrollerStore } from '~/features/home/components/common/SectionScroller/section-scroller.store'

export interface Props {
  className?: string
  children?: React.ReactNode
  href?: string
}

export default function NavMenuItem({ className = '', children = null, href = '' }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isActive = useSectionScrollerStore(selectIsHrefActive(href))

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

function selectIsHrefActive(href: string) {
  const targetId = href.startsWith('#') ? href.slice(1) : null
  return (state: ReturnType<typeof useSectionScrollerStore.getState>) => {
    if (!targetId) return false
    const activeId = state.sections[state.activeIndex]?.id
    return activeId === targetId
  }
}
