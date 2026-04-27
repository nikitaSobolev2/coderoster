import 'server-only'
import type { SearchHit } from './types'

export interface StaticRoute {
  id: string
  title: string
  subtitle: string
  href: string
  requiresAuth: boolean
}

/**
 * Curated list of in-app destinations the spotlight can jump to. Kept tiny
 * and hand-maintained — DRY single source of truth for "static" search hits
 * that don't live in the database.
 */
export const STATIC_ROUTES: StaticRoute[] = [
  {
    id: 'courses',
    title: 'Каталог курсов',
    subtitle: 'Все курсы и фильтры',
    href: '/courses',
    requiresAuth: false
  },
  {
    id: 'achievements',
    title: 'Достижения',
    subtitle: 'Каталог ачивок и прогресс',
    href: '/achievements',
    requiresAuth: false
  },
  {
    id: 'leaderboard',
    title: 'Лидерборд',
    subtitle: 'Рейтинг учеников по XP',
    href: '/leaderboard',
    requiresAuth: false
  },
  {
    id: 'daily',
    title: 'Дейлики',
    subtitle: 'Задачи на каждый день',
    href: '/daily',
    requiresAuth: true
  },
  {
    id: 'weekly',
    title: 'Спидраны',
    subtitle: 'Задачи на ISO-неделю',
    href: '/weekly',
    requiresAuth: true
  },
  {
    id: 'sandbox',
    title: 'Песочница',
    subtitle: 'Свободный редактор кода',
    href: '/sandbox',
    requiresAuth: true
  },
  {
    id: 'profile',
    title: 'Мой профиль',
    subtitle: 'Прогресс, активность, ачивки',
    href: '/u/me',
    requiresAuth: true
  },
  {
    id: 'settings',
    title: 'Настройки',
    subtitle: 'Профиль, аватар, био, аккаунт',
    href: '/settings',
    requiresAuth: true
  }
]

/**
 * Returns the static routes whose title or subtitle matches `term`,
 * filtered by auth visibility. Match is plain case-insensitive includes —
 * the route list is short, so any cleverer scoring would be over-design.
 */
export function matchStaticRoutes(
  term: string,
  options: { includeAuthRoutes: boolean; limit: number }
): SearchHit[] {
  const needle = term.trim().toLowerCase()
  if (!needle) return []
  return STATIC_ROUTES.filter(route => options.includeAuthRoutes || !route.requiresAuth)
    .filter(route =>
      `${route.title} ${route.subtitle} ${route.href} ${route.id}`.toLowerCase().includes(needle)
    )
    .slice(0, options.limit)
    .map(route => ({
      kind: 'app' as const,
      id: route.id,
      title: route.title,
      subtitle: route.subtitle,
      href: route.href
    }))
}
