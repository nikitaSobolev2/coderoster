/**
 * Domain types shared by every server repository. The frontend imports these via tRPC
 * router output inference, so they intentionally avoid Prisma-specific shapes.
 */

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

export interface CourseSummary {
  id: string
  slug: string
  title: string
  description: string
  language: Language
  difficulty: Difficulty
  durationHours: number
  xpReward: number
  enrollmentCount: number
  thumbnail: string | null
  tags: string[]
  author: AuthorRef
  category: CategoryRef | null
}

export interface LessonSummary {
  id: string
  title: string
  kind: LessonKind
  estimatedMinutes: number
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
  starterCode: string
  language: Language
  tests: LessonTestSpec[]
  previousLessonId: string | null
  nextLessonId: string | null
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
  language?: Language
  difficulty?: Difficulty
  /** CourseCategory slug. */
  categorySlug?: string
  /** Inclusive lower bound for `durationHours`. */
  durationMin?: number
  /** Inclusive upper bound for `durationHours`. */
  durationMax?: number
  sort?: 'popular' | 'newest' | 'shortest'
  cursor?: string
  limit?: number
}

export interface CourseShowcase {
  course: CourseSummary
  enrollment: EnrollmentState
}

export interface ProfileShowcase {
  active: CourseShowcase[]
  finished: CourseShowcase[]
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
