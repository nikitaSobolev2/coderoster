'use client'

import { useRef } from 'react'
import { useFooterEntrance } from '~/features/home/hooks/sectionEntrance/useFooterEntrance'
import { faGithub, faTelegram, faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import Logo from '~/shared/components/common/Logo'
import SectionHeader from '~/features/home/components/ui/SectionHeader'
import InteractiveLink from '~/features/home/components/ui/InteractiveLink'
import ContactForm from './ContactForm'
import { FOOTER_SECTION_ID } from '~/features/home/components/sections/section-ids'
import { SITE_NAME } from '~/shared/constants/site'
import styles from './styles.module.scss'

interface SocialLink {
  href: string
  label: string
  icon: IconDefinition
}

const SOCIAL_LINKS: SocialLink[] = [
  { href: 'https://github.com/coderoster', label: 'GitHub', icon: faGithub },
  { href: 'https://t.me/coderoster', label: 'Telegram', icon: faTelegram },
  { href: 'https://x.com/coderoster', label: 'X', icon: faXTwitter }
]

const NAV_LINKS = [
  { href: '#home', label: 'Главная' },
  { href: '#bitter-truth', label: 'Горькая правда' },
  { href: '#what-to-do', label: 'Решение' },
  { href: '#how-to-start', label: 'Как начать' },
  { href: '#features', label: 'Платформа' },
  { href: '/plans', label: 'Тарифы' }
]

export default function FooterSection() {
  const sectionRef = useRef<HTMLElement>(null)
  useFooterEntrance(sectionRef, {
    wordmark: styles.footer__bgWordmark!,
    intro: styles.footer__intro!,
    brand: styles.footer__brand!,
    form: styles.footer__form!,
    bottom: styles.footer__bottom!
  })

  return (
    <section
      ref={sectionRef}
      id={FOOTER_SECTION_ID}
      className={styles.footer}
      data-section="footer"
    >
      <span className={styles.footer__bgWordmark} aria-hidden="true">
        {SITE_NAME}
      </span>
      <div className={styles.footer__inner}>
        <div className={styles.footer__intro}>
          <SectionHeader
            number="06"
            eyebrow="Контакты"
            title="напиши нам"
            subtitle="Партнёрство, поддержка, обратная связь — мы читаем каждое сообщение."
          />
        </div>
        <div className={styles.footer__grid}>
          <div className={styles.footer__brand}>
            <InteractiveLink className={styles.footer__logoLink} href="#home">
              <Logo className={styles.footer__logo} />
            </InteractiveLink>
            <p className={styles.footer__tagline}>
              Учись писать код. Получай реальный фидбек. Расти быстрее.
            </p>
            <ul className={styles.footer__socials}>
              {SOCIAL_LINKS.map(link => (
                <li key={link.label}>
                  <InteractiveLink
                    className={styles.footer__social}
                    href={link.href}
                    aria-label={link.label}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FontAwesomeIcon icon={link.icon} />
                  </InteractiveLink>
                </li>
              ))}
            </ul>
            <ul className={styles.footer__nav}>
              {NAV_LINKS.map(link => (
                <li key={link.href}>
                  <InteractiveLink className={styles.footer__navLink} href={link.href}>
                    {link.label}
                  </InteractiveLink>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.footer__form}>
            <ContactForm />
          </div>
        </div>
        <div className={styles.footer__bottom}>
          <span>
            © {new Date().getFullYear()} {SITE_NAME}
          </span>
          <span>Build, ship, repeat.</span>
        </div>
      </div>
    </section>
  )
}
