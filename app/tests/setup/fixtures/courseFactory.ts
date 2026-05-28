import { faker } from '@faker-js/faker'
import type {
  AuthorRef,
  CategoryRef,
  CourseDetail,
  Difficulty,
  Language,
  ModuleSummary,
  LessonSummary
} from '~/server/repositories/types'

export function authorRefFactory(overrides: Partial<AuthorRef> = {}): AuthorRef {
  return {
    id: overrides.id ?? faker.string.uuid(),
    username: overrides.username ?? faker.internet.username().toLowerCase(),
    displayName: overrides.displayName ?? faker.person.fullName(),
    avatarUrl: overrides.avatarUrl ?? null
  }
}

export function categoryRefFactory(overrides: Partial<CategoryRef> = {}): CategoryRef {
  const slug = overrides.slug ?? faker.helpers.slugify(faker.lorem.word())
  return {
    id: overrides.id ?? faker.string.uuid(),
    slug,
    title: overrides.title ?? faker.lorem.word(),
    iconKey: overrides.iconKey ?? null
  }
}

export function lessonSummaryFactory(overrides: Partial<LessonSummary> = {}): LessonSummary {
  return {
    id: overrides.id ?? faker.string.uuid(),
    title: overrides.title ?? faker.lorem.words({ min: 2, max: 4 }),
    kind: overrides.kind ?? 'task',
    estimatedMinutes: overrides.estimatedMinutes ?? faker.number.int({ min: 5, max: 60 }),
    isPremium: overrides.isPremium ?? false,
    minPlanTier: overrides.minPlanTier ?? 0
  }
}

export function moduleSummaryFactory(overrides: Partial<ModuleSummary> = {}): ModuleSummary {
  return {
    id: overrides.id ?? faker.string.uuid(),
    title: overrides.title ?? faker.lorem.words({ min: 2, max: 4 }),
    description: overrides.description ?? faker.lorem.sentence(),
    lessons: overrides.lessons ?? [lessonSummaryFactory(), lessonSummaryFactory()]
  }
}

export function courseDetailFactory(overrides: Partial<CourseDetail> = {}): CourseDetail {
  const slug = overrides.slug ?? faker.helpers.slugify(faker.lorem.words(2)).toLowerCase()
  const language: Language = overrides.language ?? faker.helpers.arrayElement(['python', 'php'])
  const difficulty: Difficulty =
    overrides.difficulty ?? faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced'])
  const tags = overrides.tags ?? faker.lorem.words(3).split(' ')
  const modules = overrides.modules ?? [moduleSummaryFactory(), moduleSummaryFactory()]
  return {
    id: overrides.id ?? faker.string.uuid(),
    slug,
    title: overrides.title ?? faker.lorem.words({ min: 2, max: 5 }),
    description: overrides.description ?? faker.lorem.sentence(),
    shortSummary: overrides.shortSummary ?? faker.lorem.sentence(),
    longDescription: overrides.longDescription ?? faker.lorem.paragraphs(2),
    language,
    difficulty,
    durationHours: overrides.durationHours ?? faker.number.int({ min: 4, max: 40 }),
    xpReward: overrides.xpReward ?? faker.number.int({ min: 100, max: 3000 }),
    enrollmentCount: overrides.enrollmentCount ?? faker.number.int({ min: 0, max: 5000 }),
    tierRequired: overrides.tierRequired ?? 0,
    thumbnail: overrides.thumbnail ?? null,
    tags,
    author: overrides.author ?? authorRefFactory(),
    category: overrides.category ?? categoryRefFactory(),
    learningOutcomes: overrides.learningOutcomes ?? [
      faker.lorem.sentence(),
      faker.lorem.sentence()
    ],
    modules,
    hasPremiumTasks: overrides.hasPremiumTasks
  }
}
