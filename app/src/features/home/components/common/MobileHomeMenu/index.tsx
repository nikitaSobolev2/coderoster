'use client'

import { useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { SectionDescriptor } from '~/features/home/components/common/SectionScroller/section-scroller.store'
import Search from '~/shared/components/ui/search/Search'
import HeaderAuth from '~/features/home/components/common/header/HeaderAuth'
import {
  MOBILE_HOME_MENU_PANEL_ID,
  useMobileMenuStore
} from '~/features/home/stores/mobile-menu.store'
import { getHomeNavText } from '~/features/home/config/home-sections'
import styles from './styles.module.scss'

export interface Props {
  sections: readonly SectionDescriptor[]
}

export default function MobileHomeMenu({ sections }: Props) {
  const isOpen = useMobileMenuStore(s => s.isOpen)
  const close = useMobileMenuStore(s => s.close)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    globalThis.addEventListener('keydown', onKey)
    return () => globalThis.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  useEffect(() => {
    if (!isOpen) return
    const id = requestAnimationFrame(() => {
      firstLinkRef.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [isOpen])

  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      document.querySelector<HTMLButtonElement>('[data-mobile-menu-burger]')?.focus()
    }
    wasOpenRef.current = isOpen
  }, [isOpen])

  const onBackdropPointerDown = useCallback(() => {
    close()
  }, [close])

  return (
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdrop_open : ''}`}
        aria-hidden={!isOpen}
        onClick={onBackdropPointerDown}
      />
      <div
        className={`${styles.panel} ${isOpen ? styles.panel_open : ''}`}
        aria-hidden={!isOpen}
        data-home-mobile-chrome
      >
        <div
          id={MOBILE_HOME_MENU_PANEL_ID}
          className={`${styles.sheet} ${isOpen ? styles.sheet_open : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
        >
          <div className={styles.scroll}>
            <div className={styles.content}>
              <nav aria-label="Разделы сайта">
                <ul className={styles.list}>
                  {sections.map((s, i) => (
                    <li key={s.id}>
                      <Link
                        ref={i === 0 ? firstLinkRef : undefined}
                        href={`#${s.id}`}
                        className={styles.link}
                        onClick={() => close()}
                      >
                        {getHomeNavText(s.id)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className={styles.search}>
                <Search
                  searchQuery=""
                  placeholder="Поиск"
                  searchBarLayout="drawer"
                  showKeyboardBadge={false}
                />
              </div>
              <div className={styles.auth}>
                <HeaderAuth authButtonClassName={styles.drawerAuth} profileLayout="drawer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
