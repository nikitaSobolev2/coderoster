import type { SeedLesson } from './taskFactory'

export type CoursePrimaryLanguage = 'python' | 'php'

export interface CourseDef {
  slug: string
  categoryLeafSlug: string
  title: string
  summary: string
  shortSummary: string
  description: string
  difficulty: string
  durationHours: number
  xpReward: number
  tags: string[]
  author: 'primary' | 'secondary' | 'algo'
  modules: { title: string; description: string; lessons: SeedLesson[] }[]
  /** Язык по умолчанию в карточке курса и fallback для `predefinedCode`. */
  primaryLanguage?: CoursePrimaryLanguage
  /** Минимальный `Plan.tierLevel` для записи на курс. */
  tierRequired?: number
  coverImage?: string | null
}

export function moduleBlock(
  title: string,
  description: string,
  lessons: SeedLesson[]
): CourseDef['modules'][number] {
  return { title, description, lessons }
}
