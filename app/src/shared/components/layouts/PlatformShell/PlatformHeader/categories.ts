import {
  faBolt,
  faCalendarCheck,
  faCode,
  faGraduationCap,
  faRankingStar,
  faTrophy
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import type { CategoryNavParentRef } from '~/server/repositories/types'

export type { CategoryNavParentRef }

export interface NavLeaf {
  id: string
  title: string
  description: string
  href: string
  icon?: IconDefinition
}

export interface NavCategoryConfig {
  id: string
  label: string
  href?: string
  /** Static mega-links (Учиться / Практика / …). */
  items?: NavLeaf[]
  /** CMS course taxonomy — parents + children; renders two-column mega-menu when set. */
  categoryTree?: CategoryNavParentRef[]
}

/**
 * Static top-level header nav. Dynamic content (e.g. course categories
 * pulled from the DB) is appended in `PlatformHeader/index.tsx` so that
 * editorial structure stays declarative here while live data stays where
 * the request runs.
 */
export const NAV_CATEGORIES: NavCategoryConfig[] = [
  {
    id: 'learn',
    label: 'Учиться',
    items: [
      {
        id: 'courses',
        title: 'Курсы',
        description: 'Каталог курсов по языкам и темам',
        href: '/courses',
        icon: faGraduationCap
      },
      {
        id: 'achievements',
        title: 'Достижения',
        description: 'Раскрывай ачивки и собирай редкости',
        href: '/achievements',
        icon: faTrophy
      }
    ]
  },
  {
    id: 'practice',
    label: 'Практика',
    items: [
      {
        id: 'editor',
        title: 'Песочница',
        description: 'Запусти Python или PHP в браузере',
        href: '/sandbox',
        icon: faCode
      },
      {
        id: 'daily',
        title: 'Дейлики',
        description: 'Короткое задание дня за бонусный XP',
        href: '/daily',
        icon: faCalendarCheck
      },
      {
        id: 'weekly',
        title: 'Спидраны',
        description: 'Гонки против таймера и лимита решений',
        href: '/weekly',
        icon: faBolt
      }
    ]
  },
  {
    id: 'community',
    label: 'Сообщество',
    items: [
      {
        id: 'leaderboard',
        title: 'Лидерборд',
        description: 'Топ по XP и решённым задачам',
        href: '/leaderboard',
        icon: faRankingStar
      }
    ]
  },
  {
    id: 'plans',
    label: 'Тарифы',
    href: '/plans'
  }
]
