import { faker } from '@faker-js/faker'
import type {
  Achievement,
  AchievementCategory,
  EarnedAchievement
} from '~/server/repositories/types'

export function achievementFactory(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: overrides.id ?? `ach-${faker.string.alphanumeric(6)}`,
    name: overrides.name ?? faker.lorem.words(2),
    description: overrides.description ?? faker.lorem.sentence(),
    icon: overrides.icon ?? 'star',
    imageUrl: overrides.imageUrl ?? null,
    category:
      overrides.category ??
      (faker.helpers.arrayElement([
        'progression',
        'streak',
        'speed',
        'completionist',
        'hidden'
      ]) as AchievementCategory),
    rarity: overrides.rarity ?? faker.helpers.arrayElement(['common', 'rare', 'epic', 'legendary']),
    hidden: overrides.hidden ?? false
  }
}

export function earnedAchievementFactory(
  overrides: Partial<EarnedAchievement> = {}
): EarnedAchievement {
  const base = achievementFactory(overrides)
  const earned = overrides.earned ?? false
  return {
    ...base,
    earned,
    earnedAt: overrides.earnedAt ?? (earned ? faker.date.recent({ days: 30 }) : null)
  }
}
