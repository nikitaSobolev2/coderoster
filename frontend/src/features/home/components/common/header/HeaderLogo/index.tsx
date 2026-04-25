'use client'

import { useRef } from 'react'
import Logo from '~/shared/components/common/Logo'
import PureButton from '~/shared/components/ui/buttons/PureButton'
import { useCursorOutlineTarget } from '~/features/home/hooks/useCursorOutlineTarget'
import styles from './styles.module.scss'

export type HeaderLogoLayout = 'default' | 'island'

export interface Props {
  className?: string
  /** Island bar: mark only, tighter hit area */
  layout?: HeaderLogoLayout
}

export default function HeaderLogo({ className = '', layout = 'default' }: Props) {
  const ref = useRef<HTMLAnchorElement>(null)

  useCursorOutlineTarget(ref)

  return (
    <PureButton
      label="Главная"
      href="/"
      className={`${styles.headerLogo} ${layout === 'island' ? styles.headerLogo_island : ''} ${className}`.trim()}
      ref={ref}
    >
      <Logo withWordmark={layout === 'default'} />
    </PureButton>
  )
}
