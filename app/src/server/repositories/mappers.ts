import 'server-only'
import type {
  Achievement as PrismaAchievement,
  Comment as PrismaComment,
  Course as PrismaCourse,
  CourseModule as PrismaCourseModule,
  CourseTask as PrismaCourseTask,
  Enrollment as PrismaEnrollment,
  Execution as PrismaExecution,
  ExecutionStatus as PrismaExecutionStatus,
  User as PrismaUser,
  UserAchievementTrack as PrismaUserAchievementTrack,
  UserActivitySnapshot as PrismaActivitySnapshot
} from '@prisma/client'
import type {
  Achievement,
  ActivityCell,
  AuthorRef,
  CourseDetail,
  CourseSummary,
  Difficulty,
  EarnedAchievement,
  EnrollmentState,
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
  UserSettings
} from './types'

/**
 * Mapping helpers between Prisma rows and domain types. Kept in one file so
 * the boundary between the storage layer and the transport layer has a single
 * source of truth.
 */

type CourseWithRelations = PrismaCourse & {
  author: PrismaUser
  modules?: (PrismaCourseModule & { tasks: PrismaCourseTask[] })[]
  _count?: { enrollments: number }
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
    language: course.language as Language,
    difficulty: course.difficulty as Difficulty,
    durationHours: course.durationHours,
    xpReward: course.xpReward,
    enrollmentCount: course._count?.enrollments ?? 0,
    thumbnail: course.coverImage,
    tags: course.tags,
    author: toAuthorRef(course.author)
  }
}

export function toCourseDetail(course: CourseWithRelations): CourseDetail {
  const modules = (course.modules ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(toModuleSummary)
  return {
    ...toCourseSummary(course),
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
    estimatedMinutes: task.estimatedMinutes
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

export function toLessonDetail(
  task: PrismaCourseTask,
  module: PrismaCourseModule,
  course: PrismaCourse,
  order: number,
  previousLessonId: string | null,
  nextLessonId: string | null
): LessonDetail {
  const initial = task.initialData as Record<string, unknown> | null
  const language = (initial?.language as Language | undefined) ?? (course.language as Language)
  const starterCode = (initial?.predefinedCode as string | undefined) ?? ''
  return {
    ...toLessonSummary(task),
    courseSlug: course.slug,
    courseTitle: course.title,
    moduleId: module.id,
    moduleTitle: module.title,
    order,
    body: task.description,
    starterCode,
    language,
    tests: [
      { name: 'Базовый прогон', hidden: false },
      { name: 'Скрытый кейс', hidden: true }
    ],
    previousLessonId,
    nextLessonId
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
  isOwner: boolean
): PublicProfile {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    joinedAt: user.joinedAt,
    socials: jsonToSocials(user.socials),
    stats,
    isOwner
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
    appearance
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
