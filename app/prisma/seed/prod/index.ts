import type { CourseDef } from '../catalog/courseTypes'

import { ALGO_WEB_PROD_COURSES } from './algoWebProdCourses'
import { PROD_COVER_PROMPTS } from './coverPrompts'
import { PHP_PROD_COURSES } from './phpProdCourses'
import { PYTHON_PROD_COURSES } from './pythonProdCourses'

export const PROD_COURSE_DEFS: CourseDef[] = [
  ...PYTHON_PROD_COURSES,
  ...PHP_PROD_COURSES,
  ...ALGO_WEB_PROD_COURSES
]

export { PROD_COVER_PROMPTS }

const EXPECTED = 21

/** Гвард на целостность сидов перед запуском в прод. */
export function assertProdCatalogIntegrity(): void {
  if (PROD_COURSE_DEFS.length !== EXPECTED) {
    throw new Error(`[seed-prod] ожидалось ${EXPECTED} курсов, получено ${PROD_COURSE_DEFS.length}`)
  }
  const missingPrompts = PROD_COURSE_DEFS.filter(d => !PROD_COVER_PROMPTS[d.slug]).map(d => d.slug)
  if (missingPrompts.length) {
    throw new Error(`[seed-prod] нет промптов обложки для: ${missingPrompts.join(', ')}`)
  }
}
