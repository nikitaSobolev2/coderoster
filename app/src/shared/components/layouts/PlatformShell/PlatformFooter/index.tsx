import Link from 'next/link'
import { faGithub, faTelegram, faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import Logo from '~/shared/components/common/Logo'
import { FOOTER_COLUMNS } from './links'
import NewsletterForm from './NewsletterForm'
import styles from './styles.module.scss'

interface SocialLink {
  href: string
  label: string
  icon: IconDefinition
}

const SOCIALS: SocialLink[] = [
  { href: 'https://github.com/coderoster', label: 'GitHub', icon: faGithub },
  { href: 'https://t.me/coderoster', label: 'Telegram', icon: faTelegram },
  { href: 'https://x.com/coderoster', label: 'X', icon: faXTwitter }
]

/**
 * Slim platform footer. Same visual treatment as the home FooterSection
 * (background wordmark, frosted top border) but content is link columns
 * plus a newsletter signup instead of a contact form.
 */
export default function PlatformFooter() {
  return (
    <footer className={styles.footer}>
      <span className={styles.footer__wordmark} aria-hidden="true">
        CodeRoster
      </span>
      <div className={styles.footer__inner}>
        <div className={styles.footer__top}>
          <div className={styles.footer__brand}>
            <Logo />
            <p className={styles.footer__tagline}>
              Учись писать код. Получай реальный фидбек. Расти быстрее.
            </p>
            <ul className={styles.footer__socials}>
              {SOCIALS.map(social => (
                <li key={social.label}>
                  <a
                    className={styles.footer__social}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                  >
                    <FontAwesomeIcon icon={social.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.footer__columns}>
            {FOOTER_COLUMNS.map(column => (
              <div key={column.id} className={styles.footer__column}>
                <h3 className={styles.footer__columnTitle}>{column.title}</h3>
                <ul className={styles.footer__columnLinks}>
                  {column.links.map(link => (
                    <li key={link.href + link.label}>
                      <Link href={link.href} className={styles.footer__link}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className={`${styles.footer__column} ${styles.footer__newsletter}`}>
              <h3 className={styles.footer__columnTitle}>Рассылка</h3>
              <p className={styles.footer__newsletterCopy}>
                Раз в месяц — свежие курсы, апдейты и истории учащихся.
              </p>
              <NewsletterForm />
            </div>
          </div>
        </div>
        <div className={styles.footer__bottom}>
          <span>© {new Date().getFullYear()} CodeRoster</span>
          <span>Build, ship, repeat.</span>
        </div>
      </div>
    </footer>
  )
}
