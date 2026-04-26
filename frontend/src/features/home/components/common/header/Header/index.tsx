'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useMediaQuery } from '@mantine/hooks'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons'
import SiteSearch from '~/shared/components/ui/search/SiteSearch'
import HeaderAuth from '../HeaderAuth'
import HeaderLogo from '../HeaderLogo'
import {
  MOBILE_HOME_MENU_PANEL_ID,
  useMobileMenuStore
} from '~/features/home/stores/mobile-menu.store'
import styles from './styles.module.scss'

/** Matches `breakpoints` `$bp-nav` (mobile header island) */
const MOBILE_ISLAND_MQ = '(max-width: 768px)'
/** <470px: logo mark only; ≥470px: include wordmark (still true on 470–768 island bar) */
const MOBILE_LOGO_ICON_ONLY_MQ = '(max-width: 469px)'

export interface Props {
  className?: string
}

export default function Header({ className = '' }: Props) {
  const [active, setActive] = useState(false)
  const isIslandLayout = useMediaQuery(MOBILE_ISLAND_MQ)
  const isIconOnlyLogo = useMediaQuery(MOBILE_LOGO_ICON_ONLY_MQ)
  const menuOpen = useMobileMenuStore(s => s.isOpen)
  const toggleMenu = useMobileMenuStore(s => s.toggle)

  useEffect(() => {
    const handleScroll = () => {
      setActive(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`${styles.header} ${className} ${active ? styles.active : ''}`}
      data-home-header
    >
      <div className={styles.header__container}>
        <HeaderLogo layout={isIconOnlyLogo ? 'island' : 'default'} />

        <div className={styles.endCluster}>
          <div className={styles.container__right}>
            <SiteSearch />
            <HeaderAuth />
          </div>

          <div className={styles.islandEnd}>
            {isIslandLayout && (
              <Link className={styles.islandCta} href="/login">
                Начать сейчас
              </Link>
            )}
            <button
              type="button"
              className={styles.burger}
              aria-expanded={menuOpen}
              aria-controls={MOBILE_HOME_MENU_PANEL_ID}
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              data-mobile-menu-burger
              onClick={toggleMenu}
            >
              <span
                className={`${styles.burger__icon} ${!menuOpen ? styles.burger__icon_visible : ''}`}
                aria-hidden
              >
                <FontAwesomeIcon icon={faBars} size="lg" />
              </span>
              <span
                className={`${styles.burger__icon} ${menuOpen ? styles.burger__icon_visible : ''}`}
                aria-hidden
              >
                <FontAwesomeIcon icon={faXmark} size="lg" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
