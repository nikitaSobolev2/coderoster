import {
  faBolt,
  faCalendarDay,
  faClipboardList,
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

import type { BackofficeRole } from '~/shared/types/backoffice'

export interface AdminNavItem {
  label: string
  href: string
  icon: IconDefinition
  exact?: boolean
  /** Who may see this link; enforced in UI only — tRPC remains authoritative. */
  roles: readonly BackofficeRole[]
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
    items: [
      {
        label: 'Дашборд',
        href: '/admin',
        icon: faGaugeHigh,
        exact: true,
        roles: ['admin']
      }
    ]
  },
  {
    id: 'content',
    label: 'Контент',
    items: [
      {
        label: 'Курсы',
        href: '/admin/courses',
        icon: faGraduationCap,
        roles: ['admin', 'author']
      },
      {
        label: 'Категории',
        href: '/admin/categories',
        icon: faLayerGroup,
        roles: ['admin']
      },
      {
        label: 'Страницы',
        href: '/admin/content-pages',
        icon: faFileLines,
        roles: ['admin']
      },
      {
        label: 'Достижения',
        href: '/admin/achievements',
        icon: faMedal,
        roles: ['admin']
      }
    ]
  },
  {
    id: 'people',
    label: 'Люди',
    items: [
      {
        label: 'Пользователи',
        href: '/admin/users',
        icon: faUsers,
        roles: ['admin', 'moderator']
      },
      {
        label: 'Сообщения',
        href: '/admin/messages',
        icon: faEnvelope,
        roles: ['admin', 'moderator']
      },
      {
        label: 'Комментарии',
        href: '/admin/comments',
        icon: faComments,
        roles: ['admin', 'moderator']
      },
      {
        label: 'Лидерборд',
        href: '/admin/leaderboard',
        icon: faTrophy,
        roles: ['admin']
      }
    ]
  },
  {
    id: 'challenges',
    label: 'Челленджи',
    items: [
      {
        label: 'Дейлики',
        href: '/admin/daily',
        icon: faCalendarDay,
        roles: ['admin', 'moderator']
      },
      {
        label: 'Спидраны',
        href: '/admin/weekly',
        icon: faBolt,
        roles: ['admin', 'moderator']
      }
    ]
  },
  {
    id: 'system',
    label: 'Система',
    items: [
      {
        label: 'Тарифы',
        href: '/admin/plans',
        icon: faCrown,
        roles: ['admin']
      },
      {
        label: 'ИИ: разбор кода',
        href: '/admin/ai-code-improve',
        icon: faRobot,
        roles: ['admin']
      },
      {
        label: 'Языки',
        href: '/admin/languages',
        icon: faLanguage,
        roles: ['admin', 'author']
      },
      {
        label: 'Чат',
        href: '/admin/livechat',
        icon: faComments,
        roles: ['admin']
      },
      {
        label: 'Аудит',
        href: '/admin/audit',
        icon: faClipboardList,
        roles: ['admin']
      }
    ]
  }
]

export function filterAdminNavForRole(role: BackofficeRole): AdminNavGroup[] {
  return ADMIN_NAV.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(role))
  })).filter(group => group.items.length > 0)
}
