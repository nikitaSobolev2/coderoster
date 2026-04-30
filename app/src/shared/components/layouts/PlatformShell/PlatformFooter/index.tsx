import Link from 'next/link'
import { faGithub, faTelegram, faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { db } from '~/server/db'
import Logo from '~/shared/components/common/Logo'
import { SITE_NAME } from '~/shared/constants/site'
import NewsletterForm from './NewsletterForm'
import styles from './styles.module.scss'

interface FooterColumn {
  id: string
  title: string
  links: { label: string; href: string }[]
}

const GROUP_TITLES: Record<string, string> = {
  about: 'Компания',
  support: 'Поддержка',
  legal: 'Правовое',
  platform: 'Платформа',
  resources: 'Ресурсы'
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
 * Slim platform footer. Link columns are 100 % CMS-driven: an admin curates
 * `ContentPage` rows with `placement = FOOTER` and they show up here. No
 * hardcoded URL graveyard hiding behind the wordmark anymore.
 */
export default async function PlatformFooter() {
  const columns = appendPlansLinkLast(await loadFooterColumns())
  return (
    <footer className={styles.footer}>
      <span className={styles.footer__wordmark} aria-hidden="true">
        {SITE_NAME}
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
                      <Link href={link.href} className={styles.footer__link} prefetch={false}>
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
          <span>
            © {new Date().getFullYear()} {SITE_NAME}
          </span>
          <span>Build, ship, repeat.</span>
        </div>
      </div>
    </footer>
  )
}

async function loadFooterColumns(): Promise<FooterColumn[]> {
  try {
    const rows = await db.contentPage.findMany({
      where: { placement: 'FOOTER', published: true },
      orderBy: [{ groupKey: 'asc' }, { order: 'asc' }],
      select: { slug: true, title: true, groupKey: true }
    })
    return groupRowsByKey(rows)
  } catch {
    return []
  }
}

function groupRowsByKey(rows: { slug: string; title: string; groupKey: string }[]): FooterColumn[] {
  const grouped = new Map<string, FooterColumn>()
  for (const row of rows) {
    const id = row.groupKey || 'about'
    const existing = grouped.get(id)
    const link = { label: row.title, href: `/p/${row.slug}` }
    if (existing) {
      existing.links.push(link)
    } else {
      grouped.set(id, { id, title: GROUP_TITLES[id] ?? row.groupKey, links: [link] })
    }
  }
  return Array.from(grouped.values())
}

/** Single top-level «Тарифы» link after all CMS footer columns (before newsletter). */
function appendPlansLinkLast(columns: FooterColumn[]): FooterColumn[] {
  const plans = { label: 'Тарифы', href: '/plans' }
  if (columns.some(col => col.links.some(l => l.href === '/plans'))) return columns
  if (columns.length === 0) {
    return [{ id: 'tariffs', title: 'Платформа', links: [plans] }]
  }
  const i = columns.length - 1
  const last = columns[i]!
  return [...columns.slice(0, i), { ...last, links: [...last.links, plans] }]
}
