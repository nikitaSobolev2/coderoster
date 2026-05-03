import { env } from '~/env'
import { isTruthyFlag } from '~/server/lib/featureFlags'
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
import {
  CachedCommentRepository,
  CachedCourseRepository,
  CachedLessonRepository,
  CachedProfileRepository,
  CachedSearchRepository
} from './cached'
import {
  FakeAccountRepository,
  PrismaAccountRepository,
  type AccountRepository
} from './account.repository'
import { AdminUsersRepository } from './admin/users.repository'
import { AdminCatalogRepository } from './admin/catalog.repository'
import { AdminCourseEditorRepository } from './admin/courseEditor.repository'
import { AdminContentPagesRepository } from './admin/contentPages.repository'
import { AdminAchievementsRepository } from './admin/achievements.repository'
import { AdminChallengesRepository } from './admin/challenges.repository'
import { AdminCommentsRepository, AdminLeaderboardRepository } from './admin/moderation.repository'
import { AdminLanguagesRepository } from './admin/settings.repository'
import { AdminAuditRepository } from './admin/audit.repository'
import { AdminPlansRepository } from './admin/plans.repository'
import { AdminAiCodeImproveRepository } from './admin/aiCodeImprove.repository'
import { AdminContactMessagesRepository } from './admin/contactMessages.repository'

export interface AdminRepositories {
  users: AdminUsersRepository
  catalog: AdminCatalogRepository
  courseEditor: AdminCourseEditorRepository
  contentPages: AdminContentPagesRepository
  achievements: AdminAchievementsRepository
  challenges: AdminChallengesRepository
  leaderboard: AdminLeaderboardRepository
  comments: AdminCommentsRepository
  languages: AdminLanguagesRepository
  audit: AdminAuditRepository
  plans: AdminPlansRepository
  aiCodeImprove: AdminAiCodeImproveRepository
  contactMessages: AdminContactMessagesRepository
}

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
  account: AccountRepository
  admin: AdminRepositories
}

const adminRepositories: AdminRepositories = {
  users: new AdminUsersRepository(),
  catalog: new AdminCatalogRepository(),
  courseEditor: new AdminCourseEditorRepository(),
  contentPages: new AdminContentPagesRepository(),
  achievements: new AdminAchievementsRepository(),
  challenges: new AdminChallengesRepository(),
  leaderboard: new AdminLeaderboardRepository(),
  comments: new AdminCommentsRepository(),
  languages: new AdminLanguagesRepository(),
  audit: new AdminAuditRepository(),
  plans: new AdminPlansRepository(),
  aiCodeImprove: new AdminAiCodeImproveRepository(),
  contactMessages: new AdminContactMessagesRepository()
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
  search: new FakeSearchRepository(),
  account: new FakeAccountRepository(),
  admin: adminRepositories
}

const prismaRepositories: AppRepositories = {
  course: new CachedCourseRepository(new PrismaCourseRepository()),
  lesson: new CachedLessonRepository(new PrismaLessonRepository()),
  enrollment: new PrismaEnrollmentRepository(),
  progress: new PrismaProgressRepository(),
  execution: new PrismaExecutionRepository(),
  profile: new CachedProfileRepository(new PrismaProfileRepository()),
  settings: new PrismaSettingsRepository(),
  comment: new CachedCommentRepository(new PrismaCommentRepository()),
  search: new CachedSearchRepository(new PrismaSearchRepository()),
  account: new PrismaAccountRepository(),
  admin: adminRepositories
}

/**
 * Resolves the repository bundle for the current environment. Process-level
 * singletons keep the in-memory fakes consistent across requests and the
 * cache-decorated Prisma instances reuse the same Redis client.
 */
export function getAppRepositories(): AppRepositories {
  return isTruthyFlag(env.USE_FAKE_DATA) ? fakeRepositories : prismaRepositories
}

export type { AppRepositories as Repositories }
