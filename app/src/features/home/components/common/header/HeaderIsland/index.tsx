'use client'

import type { ReactNode } from 'react'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '@workos-inc/authkit-nextjs/components'
import { useScrolled } from '~/features/home/hooks/useScrolled'
import {
  MOBILE_HOME_MENU_PANEL_ID,
  useMobileMenuStore
} from '~/features/home/stores/mobile-menu.store'
import HeaderLogo from '../HeaderLogo'
import IslandCta from '../IslandCta'
import IslandMenuButton from '../IslandMenuButton'
import styles from './styles.module.scss'

export interface Props {
  className?: string
}

export default function HeaderIsland({ className = '' }: Readonly<Props>) {
  const scrolled = useScrolled()
  const menuOpen = useMobileMenuStore(s => s.isOpen)
  const toggleMenu = useMobileMenuStore(s => s.toggle)
  const { user, loading } = useAuth()

  let cta: ReactNode
  if (loading) {
    cta = <div className={styles.island__authPlaceholder} aria-hidden />
  } else if (user) {
    cta = (
      <IslandCta href="/courses" fullLabel="Платформа" shortLabel="Платформа" icon={faArrowRight} />
    )
  } else {
    cta = <IslandCta />
  }

  return (
    <header
      className={`${styles.island} ${className} ${scrolled ? styles.island_scrolled : ''}`.trim()}
      data-home-header
      data-scrolled={scrolled || undefined}
    >
      <div className={styles.island__container}>
        <HeaderLogo layout="island" />
        <div className={styles.island__actions}>
          {cta}
          <IslandMenuButton
            open={menuOpen}
            controlsId={MOBILE_HOME_MENU_PANEL_ID}
            onToggle={toggleMenu}
          />
        </div>
      </div>
    </header>
  )
}
