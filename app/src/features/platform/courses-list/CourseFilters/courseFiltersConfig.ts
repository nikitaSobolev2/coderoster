import type { CoursesQuery, Difficulty, Language } from '~/server/repositories/types'

export const FILTER_ALL = 'all' as const

/** Matches SCSS `$bp-nav`; touch-first sizing for filter popovers only below this width */
export const COURSE_FILTERS_TOUCH_UI_MEDIA_QUERY = '(max-width: 768px)' as const

export const DURATION_BOUNDS: [number, number] = [0, 50]

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'php', label: 'PHP' }
]

export const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: 'Новичок' },
  { value: 'intermediate', label: 'Средний' },
  { value: 'advanced', label: 'Продвинутый' }
]

export const SORT_OPTIONS: {
  value: NonNullable<CoursesQuery['sort']>
  label: string
}[] = [
  { value: 'popular', label: 'По популярности' },
  { value: 'newest', label: 'Сначала новые' },
  { value: 'shortest', label: 'Самые короткие' }
]

/** True when any catalog filter differs from defaults (search, sort, drawer fields, pills). */
export function catalogFiltersDirty(filters: CoursesQuery, defaults: CoursesQuery): boolean {
  const defaultSort = defaults.sort ?? 'popular'
  const effectiveSort = filters.sort ?? defaultSort
  if (effectiveSort !== defaultSort) return true

  if ((filters.q ?? '').trim() !== '') return true

  if ((filters.categorySlugs?.length ?? 0) > 0) return true
  if ((filters.languages?.length ?? 0) > 0) return true
  if ((filters.difficulties?.length ?? 0) > 0) return true

  if (filters.durationMin !== undefined || filters.durationMax !== undefined) return true

  if (filters.freeOnly === true) return true
  if (filters.matchesMyPlan === true) return true

  return false
}

/** Selections reflected in drawer + duration/level popovers (for mobile filter badge). */
export function activeCatalogFilterBadgeCount(filters: CoursesQuery): number {
  const categories = filters.categorySlugs?.length ?? 0
  const languages = filters.languages?.length ?? 0
  const difficulties = filters.difficulties?.length ?? 0
  const durationActive =
    filters.durationMin !== undefined || filters.durationMax !== undefined ? 1 : 0
  const tierPlan = (filters.freeOnly ? 1 : 0) + (filters.matchesMyPlan ? 1 : 0)
  return categories + languages + difficulties + durationActive + tierPlan
}
