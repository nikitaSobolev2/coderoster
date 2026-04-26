import { env } from '~/env'
import {
  FakeCourseRepository,
  PrismaCourseRepository,
  type CourseRepository
} from './course.repository'
import {
  FakeLessonRepository,
  PrismaLessonRepository,
  type LessonRepository
} from './lesson.repository'
import {
  FakeEnrollmentRepository,
  PrismaEnrollmentRepository,
  type EnrollmentRepository
} from './enrollment.repository'
import {
  FakeProgressRepository,
  PrismaProgressRepository,
  type ProgressRepository
} from './progress.repository'
import {
  FakeExecutionRepository,
  PrismaExecutionRepository,
  type ExecutionRepository
} from './execution.repository'
import {
  FakeProfileRepository,
  PrismaProfileRepository,
  type ProfileRepository
} from './profile.repository'
import {
  FakeSettingsRepository,
  PrismaSettingsRepository,
  type SettingsRepository
} from './settings.repository'
import {
  FakeCommentRepository,
  PrismaCommentRepository,
  type CommentRepository
} from './comment.repository'
import {
  FakeSearchRepository,
  PrismaSearchRepository,
  type SearchRepository
} from './search.repository'

export interface AppRepositories {
  course: CourseRepository
  lesson: LessonRepository
  enrollment: EnrollmentRepository
  progress: ProgressRepository
  execution: ExecutionRepository
  profile: ProfileRepository
  settings: SettingsRepository
  comment: CommentRepository
  search: SearchRepository
}

const fakeRepositories: AppRepositories = {
  course: new FakeCourseRepository(),
  lesson: new FakeLessonRepository(),
  enrollment: new FakeEnrollmentRepository(),
  progress: new FakeProgressRepository(),
  execution: new FakeExecutionRepository(),
  profile: new FakeProfileRepository(),
  settings: new FakeSettingsRepository(),
  comment: new FakeCommentRepository(),
  search: new FakeSearchRepository()
}

const prismaRepositories: AppRepositories = {
  course: new PrismaCourseRepository(),
  lesson: new PrismaLessonRepository(),
  enrollment: new PrismaEnrollmentRepository(),
  progress: new PrismaProgressRepository(),
  execution: new PrismaExecutionRepository(),
  profile: new PrismaProfileRepository(),
  settings: new PrismaSettingsRepository(),
  comment: new PrismaCommentRepository(),
  search: new PrismaSearchRepository()
}

/**
 * Resolve the repository bundle for the current environment. Process-level
 * singletons keep the in-memory fakes consistent across requests.
 */
export function getAppRepositories(): AppRepositories {
  return env.USE_FAKE_DATA ? fakeRepositories : prismaRepositories
}

export type { AppRepositories as Repositories }
