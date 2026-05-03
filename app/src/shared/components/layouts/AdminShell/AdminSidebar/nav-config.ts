import {
  faBolt,
  faCalendarDay,
  faClipboardList,
  faCommentSlash,
  faComments,
  faCrown,
  faEnvelope,
  faFileLines,
  faGaugeHigh,
  faGraduationCap,
  faLanguage,
  faLayerGroup,
  faMedal,
  faRobot,
  faTrophy,
  faUsers
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export interface AdminNavItem {
  label: string
  href: string
  icon: IconDefinition
  exact?: boolean
}

export interface AdminNavGroup {
  id: string
  label: string
  items: AdminNavItem[]
}

/**
 * Single source of truth for the admin sidebar. Order, labels and icons live
 * here so adding a new admin section is one append.
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    id: 'overview',
    label: 'Обзор',
    items: [{ label: 'Дашборд', href: '/admin', icon: faGaugeHigh, exact: true }]
  },
  {
    id: 'content',
    label: 'Контент',
    items: [
      { label: 'Курсы', href: '/admin/courses', icon: faGraduationCap },
      { label: 'Категории', href: '/admin/categories', icon: faLayerGroup },
      { label: 'Страницы', href: '/admin/content-pages', icon: faFileLines },
      { label: 'Достижения', href: '/admin/achievements', icon: faMedal }
    ]
  },
  {
    id: 'people',
    label: 'Люди',
    items: [
      { label: 'Пользователи', href: '/admin/users', icon: faUsers },
      { label: 'Сообщения', href: '/admin/messages', icon: faEnvelope },
      { label: 'Лидерборд', href: '/admin/leaderboard', icon: faTrophy }
    ]
  },
  {
    id: 'challenges',
    label: 'Челленджи',
    items: [
      { label: 'Дейлики', href: '/admin/daily', icon: faCalendarDay },
      { label: 'Спидраны', href: '/admin/weekly', icon: faBolt }
    ]
  },
  {
    id: 'system',
    label: 'Система',
    items: [
      { label: 'Тарифы', href: '/admin/plans', icon: faCrown },
      {
        label: 'ИИ: разбор кода',
        href: '/admin/ai-code-improve',
        icon: faRobot
      },
      { label: 'Языки', href: '/admin/languages', icon: faLanguage },
      { label: 'Чат', href: '/admin/livechat', icon: faComments },
      { label: 'Аудит', href: '/admin/audit', icon: faClipboardList }
    ]
  }
]
