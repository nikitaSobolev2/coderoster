import {
  FakeAccountRepository,
  type AccountRepository
} from '~/server/repositories/account.repository'
import {
  FakeCommentRepository,
  type CommentRepository
} from '~/server/repositories/comment.repository'
import {
  FakeCourseRepository,
  type CourseRepository
} from '~/server/repositories/course.repository'
import {
  FakeEnrollmentRepository,
  type EnrollmentRepository
} from '~/server/repositories/enrollment.repository'
import {
  FakeExecutionRepository,
  type ExecutionRepository
} from '~/server/repositories/execution.repository'
import {
  FakeLessonRepository,
  type LessonRepository
} from '~/server/repositories/lesson.repository'
import {
  FakeProfileRepository,
  type ProfileRepository
} from '~/server/repositories/profile.repository'
import {
  FakeProgressRepository,
  type ProgressRepository
} from '~/server/repositories/progress.repository'
import {
  FakeSearchRepository,
  type SearchRepository
} from '~/server/repositories/search.repository'
import {
  FakeSettingsRepository,
  type SettingsRepository
} from '~/server/repositories/settings.repository'
import type { AdminRepositories, Repositories } from '~/server/repositories'
import type { AuthenticatedUser } from '~/server/repositories/types'
import { createCaller } from '~/server/api/root'
import { db } from '~/server/db'
import { authenticatedUserFactory } from './fixtures/userFactory'

/**
 * Hand-rolled tRPC test harness. Builds a typed in-process caller bound to a
 * mutable bag of fake repositories so individual tests can pre-seed only what
 * they need. Admin repos in production are class-based with no shared
 * interface, so this stub mimics their shape with `unknown` placeholders;
 * router tests that touch admin endpoints inject explicit fakes via the
 * `adminOverrides` argument.
 */

export interface FakeUserRepositoryBag {
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
}

export function buildFakeUserRepositoryBag(): FakeUserRepositoryBag {
  return {
    course: new FakeCourseRepository(),
    lesson: new FakeLessonRepository(),
    enrollment: new FakeEnrollmentRepository(),
    progress: new FakeProgressRepository(),
    execution: new FakeExecutionRepository(),
    profile: new FakeProfileRepository(),
    settings: new FakeSettingsRepository(),
    comment: new FakeCommentRepository(),
    search: new FakeSearchRepository(),
    account: new FakeAccountRepository()
  }
}

export interface CallerOverrides {
  user?: AuthenticatedUser | null
  headers?: Record<string, string>
  repositories?: Partial<FakeUserRepositoryBag>
  /**
   * Caller passes their own admin bundle for admin router tests. Defaults to
   * an empty `Proxy` that throws on access so we surface untested admin code
   * paths quickly.
   */
  adminOverrides?: Partial<AdminRepositories>
}

export interface TestCaller {
  caller: ReturnType<typeof createCaller>
  repositories: FakeUserRepositoryBag
  user: AuthenticatedUser | null
  headers: Headers
}

const stubAdminRepositories: AdminRepositories = new Proxy({} as AdminRepositories, {
  get(_target, prop) {
    return new Proxy(
      {},
      {
        get() {
          return () => {
            throw new Error(
              `Admin repository ${String(prop)} accessed without injection. Provide adminOverrides in trpcCallerFactory.`
            )
          }
        }
      }
    )
  }
})

export function buildTestCaller(overrides: CallerOverrides = {}): TestCaller {
  const repositories = {
    ...buildFakeUserRepositoryBag(),
    ...overrides.repositories
  }
  const headers = new Headers(overrides.headers ?? {})
  const user = overrides.user === undefined ? authenticatedUserFactory() : overrides.user
  const adminRepositories: AdminRepositories = {
    ...stubAdminRepositories,
    ...overrides.adminOverrides
  } as AdminRepositories

  const repos: Repositories = {
    ...repositories,
    admin: adminRepositories
  }

  const caller = createCaller({
    db: db as never,
    headers,
    repositories: repos,
    user
  } as never)

  return { caller, repositories, user, headers }
}
