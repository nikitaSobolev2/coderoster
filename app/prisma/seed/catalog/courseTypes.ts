import type { SeedLesson } from './taskFactory'

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
}

export function moduleBlock(
  title: string,
  description: string,
  lessons: SeedLesson[]
): CourseDef['modules'][number] {
  return { title, description, lessons }
}
