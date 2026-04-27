'use client'

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

export default function HeaderIsland({ className = '' }: Props) {
  const scrolled = useScrolled()
  const menuOpen = useMobileMenuStore(s => s.isOpen)
  const toggleMenu = useMobileMenuStore(s => s.toggle)

  return (
    <header
      className={`${styles.island} ${className} ${scrolled ? styles.island_scrolled : ''}`.trim()}
      data-home-header
      data-scrolled={scrolled || undefined}
    >
      <div className={styles.island__container}>
        <HeaderLogo layout="island" />
        <div className={styles.island__actions}>
          <IslandCta />
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
