import 'server-only'
import type {
  Achievement as PrismaAchievement,
  Comment as PrismaComment,
  Course as PrismaCourse,
  CourseCategory as PrismaCourseCategory,
  CourseModule as PrismaCourseModule,
  CourseTask as PrismaCourseTask,
  Enrollment as PrismaEnrollment,
  Execution as PrismaExecution,
  ExecutionStatus as PrismaExecutionStatus,
  User as PrismaUser,
  UserAchievementTrack as PrismaUserAchievementTrack,
  UserActivitySnapshot as PrismaActivitySnapshot
} from '@prisma/client'
import { isBootstrapAdminEmail } from '~/server/auth/bootstrapAdminEmail'
import type {
  Achievement,
  ActivityCell,
  AuthorRef,
  CategoryRef,
  CourseDetail,
  CourseSummary,
  Difficulty,
  EarnedAchievement,
  EnrollmentState,
  ExecutionContextKind,
  ExecutionMode,
  ExecutionRecord,
  Language,
  LessonDetail,
  LessonSummary,
  ModuleSummary,
  ProfileCommentEntry,
  ProfileStats,
  PublicProfile,
  SocialLinks,
  TestResult,
  UserRole,
  UserSettings
} from './types'
import { requiredTierForTask } from '~/shared/lib/planTier'
import { normalizeStarterCodeMap, starterCodeForLanguage } from '~/shared/lib/taskStarterCodes'

/**
 * Mapping helpers between Prisma rows and domain types. Kept in one file so
 * the boundary between the storage layer and the transport layer has a single
 * source of truth.
 */

type CourseWithRelations = PrismaCourse & {
  author: PrismaUser
  category?: PrismaCourseCategory | null
  modules?: (PrismaCourseModule & { tasks: PrismaCourseTask[] })[]
  _count?: { enrollments: number }
}

export function toCategoryRef(
  category: PrismaCourseCategory | null | undefined
): CategoryRef | null {
  if (!category) return null
  return {
    id: category.id,
    slug: category.slug,
    title: category.title,
    iconKey: category.iconKey
  }
}

const XP_PER_LEVEL = 1_000

export function toAuthorRef(user: PrismaUser): AuthorRef {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl
  }
}

export function toCourseSummary(course: CourseWithRelations): CourseSummary {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.summary,
    shortSummary: course.shortSummary,
    language: course.language as Language,
    difficulty: course.difficulty as Difficulty,
    durationHours: course.durationHours,
    xpReward: course.xpReward,
    enrollmentCount: course._count?.enrollments ?? 0,
    thumbnail: course.coverImage,
    tags: course.tags,
    author: toAuthorRef(course.author),
    category: toCategoryRef(course.category ?? null),
    tierRequired: course.tierRequired
  }
}

export function toCourseDetail(course: CourseWithRelations): CourseDetail {
  const modules = (course.modules ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(toModuleSummary)
  const hasPremiumTasks = (course.modules ?? []).some(mod => mod.tasks.some(t => t.isPremium))
  return {
    ...toCourseSummary(course),
    hasPremiumTasks,
    longDescription: course.description,
    learningOutcomes: extractLearningOutcomes(course.description),
    modules
  }
}

function toModuleSummary(
  module: PrismaCourseModule & { tasks: PrismaCourseTask[] }
): ModuleSummary {
  return {
    id: module.id,
    title: module.title,
    description: module.description,
    lessons: module.tasks
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(toLessonSummary)
  }
}

export function toLessonSummary(task: PrismaCourseTask): LessonSummary {
  return {
    id: task.id,
    title: task.title,
    kind: kindToLessonKind(task.kind),
    estimatedMinutes: task.estimatedMinutes,
    isPremium: task.isPremium,
    minPlanTier: task.minPlanTier
  }
}

function kindToLessonKind(kind: PrismaCourseTask['kind']): LessonSummary['kind'] {
  switch (kind) {
    case 'THEORY':
      return 'theory'
    case 'QUIZ':
      return 'quiz'
    default:
      return 'task'
  }
}

export interface LessonDetailInput {
  task: PrismaCourseTask
  module: PrismaCourseModule
  course: PrismaCourse
  order: number
  previousLessonId: string | null
  nextLessonId: string | null
  testNames: { name: string; hidden: boolean }[]
  /** Viewer plan tier; `null` when anonymous. */
  viewerTier: number | null
}

function normalizeAllowedLanguages(
  taskAllowed: string[],
  courseLanguage: string,
  starterLanguages: Language[]
): Language[] {
  const fromTask = taskAllowed
    .map(l => String(l).trim().toLowerCase())
    .filter((l): l is Language => l === 'python' || l === 'php')

  const order: Language[] = ['python', 'php']
  const merged = new Set<Language>([...fromTask, ...starterLanguages])
  const union = order.filter(l => merged.has(l))
  if (union.length > 0) return union

  const cl = String(courseLanguage).trim().toLowerCase()
  if (cl === 'python' || cl === 'php') return [cl]
  return ['python']
}

function languagesDeclaredInStarterCodes(initial: Record<string, unknown> | null): Language[] {
  const map = normalizeStarterCodeMap(initial?.starterCodes)
  return (['python', 'php'] as const).filter((k): k is Language => typeof map[k] === 'string')
}

function resolveStarterCodesForLesson(
  initial: Record<string, unknown> | null,
  allowedLanguages: Language[]
): Partial<Record<Language, string>> {
  const primary = allowedLanguages[0]!
  const out: Partial<Record<Language, string>> = {}
  for (const lang of allowedLanguages) {
    out[lang] = starterCodeForLanguage({
      starterCodes: initial?.starterCodes,
      predefinedCode: initial?.predefinedCode,
      language: lang,
      primaryLanguage: primary
    })
  }
  return out
}

export function toLessonDetail(input: LessonDetailInput): LessonDetail {
  const initial = input.task.initialData as Record<string, unknown> | null
  const courseLanguage = input.course.language as Language
  const fromStarters = languagesDeclaredInStarterCodes(initial)
  const allowedLanguages = normalizeAllowedLanguages(
    input.task.allowedLanguages,
    courseLanguage,
    fromStarters
  )
  const language = allowedLanguages[0]!
  const starterCodes = resolveStarterCodesForLesson(initial, allowedLanguages)
  const starterCode = starterCodes[language] ?? ''
  const requiredPlanTier = requiredTierForTask(input.course.tierRequired, {
    isPremium: input.task.isPremium,
    minPlanTier: input.task.minPlanTier
  })
  const userCanAccess =
    input.viewerTier !== null && input.viewerTier !== undefined
      ? input.viewerTier >= requiredPlanTier
      : false
  return {
    ...toLessonSummary(input.task),
    courseSlug: input.course.slug,
    courseTitle: input.course.title,
    moduleId: input.module.id,
    moduleTitle: input.module.title,
    order: input.order,
    body: input.task.description,
    starterCode,
    starterCodes,
    language,
    allowedLanguages,
    tests: input.testNames,
    previousLessonId: input.previousLessonId,
    nextLessonId: input.nextLessonId,
    courseTierRequired: input.course.tierRequired,
    requiredPlanTier,
    userCanAccess
  }
}

export function toEnrollmentState(
  enrollment: PrismaEnrollment,
  courseSlug: string
): EnrollmentState {
  return {
    courseSlug,
    status: enrollmentStatusToDomain(enrollment.status),
    startedAt: enrollment.startedAt,
    finishedAt: enrollment.finishedAt,
    progressPercent: enrollment.progressPercent,
    completedLessonIds: enrollment.completedLessonIds,
    currentLessonId: enrollment.currentLessonId
  }
}

function enrollmentStatusToDomain(status: PrismaEnrollment['status']): EnrollmentState['status'] {
  switch (status) {
    case 'FINISHED':
      return 'finished'
    case 'ABANDONED':
      return 'abandoned'
    default:
      return 'active'
  }
}

export function toPublicProfile(
  user: PrismaUser,
  stats: ProfileStats,
  isOwner: boolean,
  plan: { slug: string; name: string; tierLevel: number } | null
): PublicProfile {
  const isStaff = user.role === 'ADMIN'
  const publicPlan =
    !isStaff && plan && plan.tierLevel > 0
      ? { slug: plan.slug, name: plan.name, tierLevel: plan.tierLevel }
      : null
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    joinedAt: user.joinedAt,
    socials: jsonToSocials(user.socials),
    stats,
    isOwner,
    isStaff,
    publicPlan
  }
}

export function toUserSettings(user: PrismaUser): UserSettings {
  const appearance = jsonToAppearance(user.appearance)
  return {
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    socials: jsonToSocials(user.socials),
    appearance,
    joinedAt: user.joinedAt,
    role: roleToDomain(user.role),
    allowSelfRoleChange: isBootstrapAdminEmail(user.email),
    deletionRequestedAt: user.deletionRequestedAt
  }
}

function roleToDomain(role: PrismaUser['role']): UserRole {
  switch (role) {
    case 'AUTHOR':
      return 'author'
    case 'MODERATOR':
      return 'moderator'
    case 'ADMIN':
      return 'admin'
    default:
      return 'learner'
  }
}

export function calculateProfileStats(input: {
  totalXp: number
  streakDays: number
  coursesCompleted: number
  coursesActive: number
  tasksSolved: number
}): ProfileStats {
  const level = Math.floor(input.totalXp / XP_PER_LEVEL) + 1
  const xpIntoLevel = input.totalXp % XP_PER_LEVEL
  return {
    totalXp: input.totalXp,
    level,
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    streakDays: input.streakDays,
    coursesCompleted: input.coursesCompleted,
    coursesActive: input.coursesActive,
    tasksSolved: input.tasksSolved
  }
}

export function toActivityCell(snapshot: PrismaActivitySnapshot): ActivityCell {
  return {
    date: snapshot.date,
    count: snapshot.count,
    level: clampLevel(snapshot.level)
  }
}

export function toAchievement(achievement: PrismaAchievement): Achievement {
  return {
    id: achievement.slug,
    name: achievement.title,
    description: achievement.description,
    icon: achievement.coverImage ?? 'trophy',
    imageUrl: achievement.imageUrl,
    category: (achievement.category as Achievement['category']) ?? 'progression',
    rarity: (achievement.rarity as Achievement['rarity']) ?? 'common',
    hidden: achievement.hidden
  }
}

export function toEarnedAchievement(
  achievement: PrismaAchievement,
  track: PrismaUserAchievementTrack | null
): EarnedAchievement {
  return {
    ...toAchievement(achievement),
    earned: track?.status === 'SUCCESS',
    earnedAt: track?.earnedAt ?? null
  }
}

export function toProfileComment(
  comment: PrismaComment & { author: PrismaUser }
): ProfileCommentEntry {
  return {
    id: comment.id,
    authorUsername: comment.author.username,
    authorDisplayName: comment.author.displayName,
    authorAvatarUrl: comment.author.avatarUrl,
    body: comment.message,
    createdAt: comment.createdAt
  }
}

export function toExecutionRecord(execution: PrismaExecution): ExecutionRecord {
  return {
    id: execution.id,
    status: executionStatusToDomain(execution.status),
    language: execution.language as Language,
    taskId: execution.taskId,
    mode: executionModeToDomain(execution.mode),
    contextKind: executionContextToDomain(execution.contextKind),
    contextRef: execution.contextRef,
    stdout: execution.stdout,
    stderr: execution.stderr,
    runtimeMs: execution.runtimeMs,
    passed: execution.passed,
    testResults: (execution.testResults as TestResult[] | null) ?? [],
    errorMessage: execution.errorMessage,
    enqueuedAt: execution.enqueuedAt,
    startedAt: execution.startedAt,
    finishedAt: execution.finishedAt
  }
}

function executionModeToDomain(mode: PrismaExecution['mode']): ExecutionMode {
  return mode === 'SUBMIT' ? 'submit' : 'run'
}

function executionContextToDomain(context: PrismaExecution['contextKind']): ExecutionContextKind {
  switch (context) {
    case 'SANDBOX':
      return 'sandbox'
    case 'DAILY':
      return 'daily'
    case 'WEEKLY':
      return 'weekly'
    default:
      return 'course'
  }
}

function executionStatusToDomain(status: PrismaExecutionStatus): ExecutionRecord['status'] {
  switch (status) {
    case 'QUEUED':
      return 'queued'
    case 'RUNNING':
      return 'running'
    case 'SUCCESS':
      return 'success'
    case 'FAILED':
      return 'failed'
    case 'TIMEOUT':
      return 'timeout'
    default:
      return 'cancelled'
  }
}

function jsonToSocials(value: unknown): SocialLinks {
  const partial = (value as Partial<SocialLinks>) ?? {}
  return {
    github: partial.github ?? null,
    linkedin: partial.linkedin ?? null,
    x: partial.x ?? null,
    website: partial.website ?? null
  }
}

function jsonToAppearance(value: unknown): UserSettings['appearance'] {
  const partial = (value as Partial<UserSettings['appearance']>) ?? {}
  return { colorScheme: partial.colorScheme ?? 'dark' }
}

function clampLevel(level: number): ActivityCell['level'] {
  if (level <= 0) return 0
  if (level === 1) return 1
  if (level === 2) return 2
  if (level === 3) return 3
  return 4
}

function extractLearningOutcomes(description: string): string[] {
  const lines = description.split('\n').filter(line => line.trim().startsWith('- '))
  if (lines.length === 0) return []
  return lines.map(line => line.replace(/^[-*]\s+/, '').trim())
}
