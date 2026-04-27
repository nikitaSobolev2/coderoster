'use client'

import SiteSearch from '~/shared/components/ui/search/SiteSearch'
import { useScrolled } from '~/features/home/hooks/useScrolled'
import HeaderAuth from '../HeaderAuth'
import HeaderLogo from '../HeaderLogo'
import styles from './styles.module.scss'

export interface Props {
  className?: string
}

export default function HeaderDesktop({ className = '' }: Props) {
  const scrolled = useScrolled()

  return (
    <header
      className={`${styles.header} ${className} ${scrolled ? styles.header_scrolled : ''}`.trim()}
      data-home-header
      data-scrolled={scrolled || undefined}
    >
      <div className={styles.header__container}>
        <HeaderLogo />
        <div className={styles.header__actions}>
          <SiteSearch />
          <HeaderAuth />
        </div>
      </div>
    </header>
  )
}
