'use client'

import SiteSearch from '~/shared/components/ui/search/SiteSearch'
import { useScrolled } from '~/features/home/hooks/useScrolled'
import HomeLiveChatHeaderButton from '~/features/livechat/home/HomeLiveChatHeaderButton'
import { useLiveChatHome } from '~/features/livechat/home/livechatHome.context'
import HeaderAuth from '../HeaderAuth'
import HeaderLogo from '../HeaderLogo'
import styles from './styles.module.scss'

export interface Props {
  className?: string
}

export default function HeaderDesktop({ className = '' }: Props) {
  const scrolled = useScrolled()
  const liveChatHome = useLiveChatHome()

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
          {liveChatHome ? <HomeLiveChatHeaderButton onClick={() => liveChatHome.toggle()} /> : null}
          <HeaderAuth />
        </div>
      </div>
    </header>
  )
}
