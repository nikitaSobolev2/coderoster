import type { SeedCourseMeta } from '../catalog/seedCourses'
import { seedDemoLearnersForCourses } from '../users/bulkUsers'

const PROD_DEMO_LEARNER_COUNT = 24

/**
 * Cohort isolated by `workosUserId` prefix — safe alongside real accounts (e.g. WorkOS users).
 * Assigns free plan, enrollments, attempts, achievements, heatmap snapshots.
 */
export async function seedProdDemoLearners(
  courses: SeedCourseMeta[],
  freePlanId: string
): Promise<void> {
  console.log('[seed-prod] demo learners (isolated prefix)')
  await seedDemoLearnersForCourses(courses, {
    workosIdPrefix: 'seed-prod-demo-',
    usernamePrefix: 'seedprodemo',
    count: PROD_DEMO_LEARNER_COUNT,
    planId: freePlanId,
    heatmapAnchor: '2026-02-01',
    heatmapSpanDays: 90,
    lessonActivityPayloadKey: 'seedProdDemo',
    bioLine: i => `Демо-профиль прод-сида №${i}. Активность синтетическая.`
  })
}
