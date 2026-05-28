import { faker } from '@faker-js/faker'
import type { PlanSummary } from '~/server/repositories/types'

export function planSummaryFactory(overrides: Partial<PlanSummary> = {}): PlanSummary {
  const tierLevel = overrides.tierLevel ?? faker.number.int({ min: 0, max: 3 })
  return {
    id: overrides.id ?? faker.string.uuid(),
    slug: overrides.slug ?? `plan-${faker.string.alphanumeric(6)}`,
    name: overrides.name ?? faker.lorem.word(),
    shortDescription: overrides.shortDescription ?? faker.lorem.sentence(),
    marketingMarkdown: overrides.marketingMarkdown ?? faker.lorem.paragraph(),
    marketingFeatures: overrides.marketingFeatures ?? [],
    isBestseller: overrides.isBestseller ?? false,
    tierLevel,
    xpBonusPercent: overrides.xpBonusPercent ?? tierLevel * 10,
    sortOrder: overrides.sortOrder ?? tierLevel,
    maxActiveCourses: overrides.maxActiveCourses ?? (tierLevel === 0 ? 3 : null)
  }
}
