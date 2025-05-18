'use client'

import { useState, useEffect } from 'react'
import SiteSearch from '~/shared/components/ui/search/SiteSearch'
import HeaderAuth from '../HeaderAuth'
import HeaderLogo from '../HeaderLogo'
import styles from './styles.module.scss'

export interface Props {
  className?: string
}

export default function Header({ className = '' }: Props) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setActive(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`${styles.header} ${className} ${active ? styles.active : ''}`}>
      <div className={styles.header__container}>
        <HeaderLogo />

        <div className={styles.container__right}>
          <SiteSearch />
          <HeaderAuth />
        </div>
      </div>
    </header>
  )
}
