import {
  faBolt,
  faCalendarCheck,
  faChartLine,
  faCode,
  faGraduationCap,
  faRankingStar,
  faRoute,
  faTrophy,
  faUser
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export interface NavLeaf {
  id: string
  title: string
  description: string
  href: string
  icon: IconDefinition
}

export interface NavCategoryConfig {
  id: string
  label: string
  href?: string
  items?: NavLeaf[]
}

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
        id: 'paths',
        title: 'Маршруты',
        description: 'Длинные траектории до уровня middle',
        href: '/coming-soon',
        icon: faRoute
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
      },
      {
        id: 'profiles',
        title: 'Профили',
        description: 'Зайди в свой профиль',
        href: '/u/me',
        icon: faUser
      },
      {
        id: 'analytics',
        title: 'Метрики',
        description: 'Прогресс по неделям и сильные/слабые темы',
        href: '/coming-soon',
        icon: faChartLine
      }
    ]
  },
  {
    id: 'docs',
    label: 'Документация',
    href: '/coming-soon'
  }
]
