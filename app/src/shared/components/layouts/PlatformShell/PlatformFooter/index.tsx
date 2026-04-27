import Link from 'next/link'
import { faGithub, faTelegram, faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { db } from '~/server/db'
import Logo from '~/shared/components/common/Logo'
import { FOOTER_COLUMNS, type FooterColumn } from './links'
import NewsletterForm from './NewsletterForm'
import styles from './styles.module.scss'

const GROUP_TITLES: Record<string, string> = {
  about: 'Компания',
  support: 'Поддержка',
  legal: 'Правовое'
}

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
export default async function PlatformFooter() {
  const dynamicColumns = await loadDynamicColumns()
  const columns = mergeColumns(FOOTER_COLUMNS, dynamicColumns)
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
            {columns.map(column => (
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

async function loadDynamicColumns(): Promise<FooterColumn[]> {
  try {
    const rows = await db.contentPage.findMany({
      where: { placement: 'FOOTER', published: true },
      orderBy: [{ groupKey: 'asc' }, { order: 'asc' }],
      select: { slug: true, title: true, groupKey: true }
    })
    const grouped = new Map<string, FooterColumn>()
    for (const row of rows) {
      const id = row.groupKey || 'about'
      const existing = grouped.get(id)
      if (existing) {
        existing.links.push({ label: row.title, href: `/p/${row.slug}` })
      } else {
        grouped.set(id, {
          id,
          title: GROUP_TITLES[id] ?? row.groupKey,
          links: [{ label: row.title, href: `/p/${row.slug}` }]
        })
      }
    }
    return Array.from(grouped.values())
  } catch {
    return []
  }
}

/**
 * Replaces the static "company" column with the dynamic content-pages
 * columns whenever the DB has any. Falls back to the static link list when
 * no published page exists yet (typical fresh install).
 */
function mergeColumns(staticColumns: FooterColumn[], dynamic: FooterColumn[]): FooterColumn[] {
  if (dynamic.length === 0) return staticColumns
  const dynamicIds = new Set(dynamic.map(column => column.id))
  const filtered = staticColumns.filter(
    column => !dynamicIds.has(column.id) && column.id !== 'company'
  )
  return [...filtered, ...dynamic]
}
