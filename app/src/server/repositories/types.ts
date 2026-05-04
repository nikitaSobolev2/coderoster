/**
 * Domain types shared by every server repository. The frontend imports these via tRPC
 * router output inference, so they intentionally avoid Prisma-specific shapes.
 */

import type { PlanMarketingBullet } from '~/shared/plan/planMarketing'

export type Language = 'python' | 'php'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type LessonKind = 'theory' | 'task' | 'quiz'

export type EnrollmentStatus = 'active' | 'finished' | 'abandoned'

export interface AuthorRef {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export interface CategoryRef {
  id: string
  slug: string
  title: string
  iconKey: string | null
}

/** CMS category row — leaf link in mega-menu column 2. */
export interface CategoryNavChildRef {
  id: string
  slug: string
  title: string
  summary: string
  iconKey: string | null
}

/** Root taxonomy branch — column 1 lists parents; column 2 lists selected parent’s children. */
export interface CategoryNavParentRef {
  id: string
  slug: string
  title: string
  summary: string
  iconKey: string | null
  children: CategoryNavChildRef[]
}

export interface CourseSummary {
  id: string
  slug: string
  title: string
  /** Catalog summary (maps to DB `Course.summary`). */
  description: string
  /** Short blurb for dense card layouts (DB `Course.shortSummary`). */
  shortSummary: string
  language: Language
  difficulty: Difficulty
  durationHours: number
  xpReward: number
  enrollmentCount: number
  thumbnail: string | null
  tags: string[]
  author: AuthorRef
  category: CategoryRef | null
  /** Minimum plan tier (`Plan.tierLevel`) to enroll. */
  tierRequired: number
  /**
   * Catalog signal: any task `isPremium`, or course `tierRequired > 0`.
   * UI shows pink «Премиум-задачи» only when this is true and `tierRequired === 0`
   * (`shouldShowPremiumTasksChip`). Tier-gated courses use «Премиум · Тир N» only.
   */
  hasPremiumTasks?: boolean
}

export interface LessonSummary {
  id: string
  title: string
  kind: LessonKind
  estimatedMinutes: number
  isPremium: boolean
  minPlanTier: number
}

export interface ModuleSummary {
  id: string
  title: string
  description: string
  lessons: LessonSummary[]
}

export interface CourseDetail extends CourseSummary {
  longDescription: string
  learningOutcomes: string[]
  modules: ModuleSummary[]
}

export interface LessonTestSpec {
  name: string
  hidden: boolean
  expectedStdout?: string
}

export interface CourseTaskAutotest {
  id: string
  order: number
  name: string
  input: string | null
  expected: string
  hidden: boolean
}

export interface LessonDetail extends LessonSummary {
  courseSlug: string
  courseTitle: string
  moduleId: string
  moduleTitle: string
  order: number
  body: string
  /** Default / first editor language. */
  language: Language
  /** All languages shown as editor tabs. */
  allowedLanguages: Language[]
  /** Template code per language (from admin). */
  starterCodes: Partial<Record<Language, string>>
  /** Convenience: same as `starterCodes[language]` (first tab). */
  starterCode: string
  tests: LessonTestSpec[]
  previousLessonId: string | null
  nextLessonId: string | null
  courseTierRequired: number
  /** Effective tier needed for this lesson. */
  requiredPlanTier: number
  userCanAccess: boolean
}

export interface EnrollmentState {
  courseSlug: string
  status: EnrollmentStatus
  startedAt: Date
  finishedAt: Date | null
  progressPercent: number
  completedLessonIds: string[]
  currentLessonId: string | null
}

export interface TestResult {
  name: string
  passed: boolean
  expected: string | null
  actual: string | null
  message: string | null
  /** If true, omit expected/actual in UI (autograder / course policy). */
  hidden?: boolean
  /** Optional stdin the runner fed for this case (for transparency). */
  input?: string | null
}

export interface RunResult {
  stdout: string
  stderr: string
  runtimeMs: number
  passed: boolean
  testResults: TestResult[]
}

export interface SocialLinks {
  github: string | null
  linkedin: string | null
  x: string | null
  website: string | null
}

export interface ProfileStats {
  totalXp: number
  level: number
  xpIntoLevel: number
  xpForNextLevel: number
  streakDays: number
  coursesCompleted: number
  coursesActive: number
  tasksSolved: number
}

export interface PublicProfile {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string
  joinedAt: Date
  socials: SocialLinks
  stats: ProfileStats
  isOwner: boolean
  /** ADMIN platform role — show staff badge on profile. */
  isStaff: boolean
  /** Current subscription tier for public display; null for free or unset. */
  publicPlan: { slug: string; name: string; tierLevel: number } | null
}

export interface ActivityCell {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export type AchievementCategory = 'progression' | 'streak' | 'speed' | 'completionist' | 'hidden'

export interface Achievement {
  id: string
  name: string
  description: string
  /** FontAwesome icon key. Used when `imageUrl` is null. */
  icon: string
  /** Uploaded image URL; takes precedence when set. */
  imageUrl: string | null
  category: AchievementCategory
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  hidden: boolean
}

export interface EarnedAchievement extends Achievement {
  earnedAt: Date | null
  earned: boolean
}

export interface ProfileCommentEntry {
  id: string
  authorUsername: string
  authorDisplayName: string
  authorAvatarUrl: string | null
  body: string
  createdAt: Date
}

export interface ProfileCommentsPage {
  items: ProfileCommentEntry[]
  nextCursor: string | null
}

export type UserRole = 'learner' | 'author' | 'moderator' | 'admin'

export interface UserSettings {
  displayName: string
  username: string
  email: string
  bio: string
  avatarUrl: string | null
  socials: SocialLinks
  appearance: {
    colorScheme: 'dark' | 'light'
  }
  joinedAt: Date
  role: UserRole
  /**
   * True only when `email` matches server env `ADMIN_BOOTSTRAP_EMAIL`.
   * Lets that account switch platform role locally for dev/staging (WorkOS has no app-level roles).
   */
  allowSelfRoleChange: boolean
  deletionRequestedAt: Date | null
}

export type SearchHitKind = 'course' | 'user' | 'lesson' | 'page' | 'app'

export interface SearchHit {
  kind: SearchHitKind
  id: string
  title: string
  subtitle: string | null
  href: string
}

export interface GlobalSearchResults {
  courses: SearchHit[]
  users: SearchHit[]
  lessons: SearchHit[]
  /** CMS content pages (`/p/[slug]`). */
  pages: SearchHit[]
  /** Static app routes (e.g. /sandbox, /achievements). */
  appPages: SearchHit[]
}

export interface GlobalSearchOptions {
  /**
   * Authenticated-only routes (`/settings`, `/sandbox`, `/u/me`, etc.) only
   * surface for signed-in users. The router derives this from `ctx.user`.
   */
  includeAuthRoutes: boolean
}

export interface CoursesPage {
  items: CourseSummary[]
  nextCursor: string | null
  total: number
}

export interface CoursesQuery {
  q?: string
  /** Match any of these languages (OR). */
  languages?: Language[]
  /** Match any of these difficulties (OR). */
  difficulties?: Difficulty[]
  /** Match any of these category slugs (OR). */
  categorySlugs?: string[]
  /** Inclusive lower bound for `durationHours`. */
  durationMin?: number
  /** Inclusive upper bound for `durationHours`. */
  durationMax?: number
  sort?: 'popular' | 'newest' | 'shortest'
  cursor?: string
  limit?: number
  /** Only courses with `tierRequired === 0`. */
  freeOnly?: boolean
  /** `tierRequired <=` viewer plan tier (resolved server-side; guests use `0`). */
  matchesMyPlan?: boolean
}

export interface CourseShowcase {
  course: CourseSummary
  enrollment: EnrollmentState
}

export interface PlanSummary {
  id: string
  slug: string
  name: string
  shortDescription: string
  marketingMarkdown: string
  marketingFeatures: PlanMarketingBullet[]
  isBestseller: boolean
  tierLevel: number
  xpBonusPercent: number
  sortOrder: number
  maxActiveCourses: number | null
}

export interface AuthenticatedUser {
  id: string
  username: string
  email: string
  displayName: string
  role: UserRole
  bannedUntil: Date | null
  banReason: string | null
  chatBannedUntil: Date | null
  chatBanReason: string | null
  livechatConsentAt: Date | null
  livechatUsernameColor: string | null
}

export type ExecutionStatus = 'queued' | 'running' | 'success' | 'failed' | 'timeout' | 'cancelled'

export type ExecutionMode = 'run' | 'submit'
export type ExecutionContextKind = 'course' | 'sandbox' | 'daily' | 'weekly'

export interface ExecutionRecord {
  id: string
  status: ExecutionStatus
  language: Language
  taskId: string | null
  mode: ExecutionMode
  contextKind: ExecutionContextKind
  contextRef: string | null
  stdout: string | null
  stderr: string | null
  runtimeMs: number | null
  passed: boolean | null
  testResults: TestResult[]
  errorMessage: string | null
  enqueuedAt: Date
  startedAt: Date | null
  finishedAt: Date | null
}
