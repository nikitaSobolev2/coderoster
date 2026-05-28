import { faker } from '@faker-js/faker'
import type { Language, LessonDetail } from '~/server/repositories/types'

export function lessonDetailFactory(overrides: Partial<LessonDetail> = {}): LessonDetail {
  const language: Language = overrides.language ?? 'python'
  const courseSlug = overrides.courseSlug ?? faker.helpers.slugify(faker.lorem.words(2))
  return {
    id: overrides.id ?? faker.string.uuid(),
    title: overrides.title ?? faker.lorem.words({ min: 2, max: 4 }),
    kind: overrides.kind ?? 'task',
    estimatedMinutes: overrides.estimatedMinutes ?? 15,
    isPremium: overrides.isPremium ?? false,
    minPlanTier: overrides.minPlanTier ?? 0,
    courseSlug,
    courseTitle: overrides.courseTitle ?? faker.lorem.words(2),
    moduleId: overrides.moduleId ?? faker.string.uuid(),
    moduleTitle: overrides.moduleTitle ?? faker.lorem.words(2),
    order: overrides.order ?? 1,
    body: overrides.body ?? faker.lorem.paragraph(),
    language,
    allowedLanguages: overrides.allowedLanguages ?? [language],
    starterCodes: overrides.starterCodes ?? { [language]: '# starter\n' },
    starterCode: overrides.starterCode ?? '# starter\n',
    tests: overrides.tests ?? [{ name: 'baseline', hidden: false }],
    previousLessonId: overrides.previousLessonId ?? null,
    nextLessonId: overrides.nextLessonId ?? null,
    courseTierRequired: overrides.courseTierRequired ?? 0,
    requiredPlanTier: overrides.requiredPlanTier ?? 0,
    userCanAccess: overrides.userCanAccess ?? true
  }
}
