import { faker } from '@faker-js/faker'
import type { EnrollmentState, EnrollmentStatus } from '~/server/repositories/types'

export function enrollmentStateFactory(overrides: Partial<EnrollmentState> = {}): EnrollmentState {
  const status: EnrollmentStatus = overrides.status ?? 'active'
  return {
    courseSlug: overrides.courseSlug ?? faker.helpers.slugify(faker.lorem.words(2)),
    status,
    startedAt: overrides.startedAt ?? faker.date.past({ years: 0.1 }),
    finishedAt:
      overrides.finishedAt ?? (status === 'finished' ? faker.date.recent({ days: 5 }) : null),
    progressPercent: overrides.progressPercent ?? (status === 'finished' ? 100 : 25),
    completedLessonIds: overrides.completedLessonIds ?? [],
    currentLessonId: overrides.currentLessonId ?? null
  }
}
