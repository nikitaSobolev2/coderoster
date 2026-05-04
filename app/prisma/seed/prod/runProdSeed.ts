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

/**
 * Полное наполнение каталога под прод (RU): тарифы Free/Pro/Pro+, 21 курс.
 * Не создаёт массовых пользователей и не вызывает сиды дейликов.
 * Существующих пользователей (в т.ч. реальный `nikareich` после входа через WorkOS) не создаём и не перезаписываем —
 * демо-ученик есть только в обычном `prisma/seed.ts`.
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
  await seedAllCoursesFromDefs(
    PROD_COURSE_DEFS,
    { primary: author.id, secondary: secondary.id, algo: algo.id },
    leafMap
  )

  await seedContentPages()
  await seedAppSettings()
  await backfillUserPlanIds(freePlan.id)
  await promoteBootstrapAdmin()

  console.log('[seed-prod] done')
}

export async function disconnectProdPrisma(): Promise<void> {
  await prisma.$disconnect()
}
