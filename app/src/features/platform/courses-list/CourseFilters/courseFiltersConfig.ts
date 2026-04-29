import type { CoursesQuery, Difficulty, Language } from '~/server/repositories/types'

export const FILTER_ALL = 'all' as const

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

/** Selections reflected in drawer + duration/level popovers (for mobile filter badge). */
export function activeCatalogFilterBadgeCount(filters: CoursesQuery): number {
  const categories = filters.categorySlugs?.length ?? 0
  const languages = filters.languages?.length ?? 0
  const difficulties = filters.difficulties?.length ?? 0
  const durationActive =
    filters.durationMin !== undefined || filters.durationMax !== undefined ? 1 : 0
  return categories + languages + difficulties + durationActive
}
