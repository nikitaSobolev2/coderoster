'use client'

import { useRef } from 'react'
import Logo from '~/shared/components/common/Logo'
import PureButton from '~/shared/components/ui/buttons/PureButton'
import { useCursorOutlineTarget } from '~/features/home/hooks/useCursorOutlineTarget'
import styles from './styles.module.scss'

export type HeaderLogoLayout = 'default' | 'island'

export interface Props {
  className?: string
  /** Island bar: tighter padding; wordmark collapses under ~400px via CSS */
  layout?: HeaderLogoLayout
}

export default function HeaderLogo({ className = '', layout = 'default' }: Props) {
  const ref = useRef<HTMLAnchorElement>(null)
  const isIsland = layout === 'island'

  useCursorOutlineTarget(ref)

  return (
    <PureButton
      label="Главная"
      href="/"
      className={`${styles.headerLogo} ${isIsland ? styles.headerLogo_island : ''} ${className}`.trim()}
      ref={ref}
    >
      <Logo withWordmark wordmarkClassName={isIsland ? styles.headerLogo__wordmark_island : ''} />
    </PureButton>
  )
}
