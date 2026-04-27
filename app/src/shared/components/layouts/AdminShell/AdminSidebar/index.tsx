'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Logo from '~/shared/components/common/Logo'
import { ADMIN_NAV, type AdminNavItem } from './nav-config'
import styles from './styles.module.scss'

export interface Props {
  /** When provided, sidebar collapses below this viewport via Mantine `Drawer`. */
  onNavigate?: () => void
}

/**
 * Vertical admin navigation. Plain `<nav>` markup with hover affordance
 * matching the platform aesthetic; no Mantine components used so the sidebar
 * stays SSR-friendly.
 */
export default function AdminSidebar({ onNavigate }: Props) {
  const pathname = usePathname()
  return (
    <aside className={styles.sidebar} aria-label="Админ-навигация">
      <div className={styles.sidebar__brand}>
        <Link href="/admin" className={styles.sidebar__logo}>
          <Logo />
        </Link>
        <span className={styles.sidebar__brand_label}>Админ-панель</span>
      </div>
      <nav className={styles.sidebar__nav}>
        {ADMIN_NAV.map(group => (
          <div key={group.id} className={styles.sidebar__group}>
            <span className={styles.sidebar__group_label}>{group.label}</span>
            <ul className={styles.sidebar__list}>
              {group.items.map(item => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  active={isActive(pathname, item)}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className={styles.sidebar__footer}>
        <Link href="/" className={styles.sidebar__back}>
          На платформу
        </Link>
      </div>
    </aside>
  )
}

interface SidebarLinkProps {
  item: AdminNavItem
  active: boolean
  onNavigate?: () => void
}

function SidebarLink({ item, active, onNavigate }: SidebarLinkProps) {
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`${styles.sidebar__link} ${active ? styles.sidebar__link_active : ''}`}
      >
        <FontAwesomeIcon icon={item.icon} className={styles.sidebar__icon} />
        <span>{item.label}</span>
      </Link>
    </li>
  )
}

function isActive(pathname: string | null, item: AdminNavItem): boolean {
  if (!pathname) return false
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
