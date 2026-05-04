import {
  backfillUserPlanIds,
  promoteBootstrapAdmin,
  seedAchievements,
  seedAppSettings,
  seedContentPages,
  seedPlans
} from '../bootstrap'
import { seedCatalogCategories } from '../catalog/categories'
import { seedAllCoursesFromDefs } from '../catalog/seedCourses'
import { prisma } from '../lib/client'
import { upsertAlgoAuthor, upsertAuthor, upsertSecondaryAuthor } from '../lib/seedUser'

import { assertProdCatalogIntegrity, PROD_COURSE_DEFS } from './index'
import { seedProdDemoLearners } from './prodDemoUsers'

/**
 * Полное наполнение каталога под прод (RU): тарифы Free/Pro/Pro+, 21 курс,
 * изолированные демо-ученики (`seed-prod-demo-*`) с активностью под heatmap/ачивки.
 * Не вызывает сиды дейликов. Реальные WorkOS-аккаунты не трогаем.
 */
export async function runProdSeed(): Promise<void> {
  assertProdCatalogIntegrity()

  console.log('[seed-prod] start')
  const freePlan = await seedPlans()

  const author = await upsertAuthor()
  const secondary = await upsertSecondaryAuthor()
  const algo = await upsertAlgoAuthor()

  await seedAchievements()
  const leafMap = await seedCatalogCategories(author.id)
  const { courses } = await seedAllCoursesFromDefs(
    PROD_COURSE_DEFS,
    { primary: author.id, secondary: secondary.id, algo: algo.id },
    leafMap
  )

  await seedProdDemoLearners(courses, freePlan.id)

  await seedContentPages()
  await seedAppSettings()
  await backfillUserPlanIds(freePlan.id)
  await promoteBootstrapAdmin()

  console.log('[seed-prod] done')
}

export async function disconnectProdPrisma(): Promise<void> {
  await prisma.$disconnect()
}
