import {
  promoteBootstrapAdmin,
  seedAchievements,
  seedAppSettings,
  seedContentPages
} from './bootstrap'
import { seedCatalogCategories } from './catalog/categories'
import { seedAllCourses } from './catalog/seedCourses'
import { seedDailyChallenges } from './challenges/daily'
import { seedWeeklyChallenges } from './challenges/weekly'
import {
  upsertAlgoAuthor,
  upsertAuthor,
  upsertDemoLearnerNikareich,
  upsertSecondaryAuthor
} from './lib/seedUser'
import { seedBulkUsers } from './users/bulkUsers'

export async function runSeed(): Promise<void> {
  console.log('[seed] start')
  const author = await upsertAuthor()
  const secondary = await upsertSecondaryAuthor()
  const algo = await upsertAlgoAuthor()
  await upsertDemoLearnerNikareich()

  await seedAchievements()
  const leafMap = await seedCatalogCategories(author.id)
  const { courses } = await seedAllCourses(
    { primary: author.id, secondary: secondary.id, algo: algo.id },
    leafMap
  )

  await seedDailyChallenges()
  await seedWeeklyChallenges()
  await seedBulkUsers(courses)

  await seedContentPages()
  await seedAppSettings()
  await promoteBootstrapAdmin()

  console.log('[seed] done')
}
