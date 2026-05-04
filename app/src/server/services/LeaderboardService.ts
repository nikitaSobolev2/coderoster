import 'server-only'
import { db } from '~/server/db'
import { cache } from '~/server/cache'

export type LeaderboardWindow = 'week' | 'month' | 'allTime'
export type LeaderboardLanguage = 'python' | 'php' | 'all'

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  xp: number
  tasksSolved: number
}

export interface GlobalLeaderboardInput {
  window: LeaderboardWindow
  language: LeaderboardLanguage
  limit?: number
}

export interface CourseLeaderboardInput {
  courseSlug: string
  window: LeaderboardWindow
  limit?: number
}

/** Stable shapes for Prisma `select` rows — avoids implicit-any when client typings lag IDE. */
type AllTimeUserRow = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  totalXp: number
  _count: { taskAttempts: number }
}

type AttemptGroupRow = {
  userId: string
  _count: { _all: number }
}

type LookupUserRow = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  totalXp: number
}

type CourseEnrollmentLeaderboardRow = {
  progressPercent: number
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    totalXp: number
    _count: { taskAttempts: number }
  }
}

const TTL_SECONDS = 60
const DEFAULT_LIMIT = 50

export class LeaderboardService {
  async global(input: GlobalLeaderboardInput): Promise<LeaderboardEntry[]> {
    const limit = input.limit ?? DEFAULT_LIMIT
    const key = `leaderboard:global:${input.window}:${input.language}:${limit}`
    return cache.wrap(key, TTL_SECONDS, () => this.computeGlobal(input, limit))
  }

  async byCourse(input: CourseLeaderboardInput): Promise<LeaderboardEntry[]> {
    const limit = input.limit ?? DEFAULT_LIMIT
    const key = `leaderboard:course:${input.courseSlug}:${input.window}:${limit}`
    return cache.wrap(key, TTL_SECONDS, () => this.computeByCourse(input, limit))
  }

  private async computeGlobal(
    input: GlobalLeaderboardInput,
    limit: number
  ): Promise<LeaderboardEntry[]> {
    if (input.window === 'allTime' && input.language === 'all') {
      return this.allTimeFromTotalXp(limit)
    }
    return this.rankFromCourseTaskAttempts(input, limit)
  }

  private async allTimeFromTotalXp(limit: number): Promise<LeaderboardEntry[]> {
    const usersRaw = await db.user.findMany({
      where: { deletionRequestedAt: null },
      orderBy: { totalXp: 'desc' },
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        totalXp: true,
        _count: { select: { taskAttempts: { where: { status: 'SUCCESS' } } } }
      }
    })
    const users: AllTimeUserRow[] = usersRaw
    return users.map((user: AllTimeUserRow, index: number) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      xp: user.totalXp,
      tasksSolved: user._count.taskAttempts
    }))
  }

  /**
   * Rankings when filtering by period and/or course language.
   * Uses successful **course** task attempts (module-backed tasks), not `Execution` rows —
   * attempts are always written on pass (including seed data); executions may be missing offline.
   */
  private async rankFromCourseTaskAttempts(
    input: GlobalLeaderboardInput,
    limit: number
  ): Promise<LeaderboardEntry[]> {
    const since = startOfWindow(input.window)
    const groupedRaw = await db.courseTaskAttempt.groupBy({
      by: ['userId'],
      where: {
        status: 'SUCCESS',
        ...(input.window === 'allTime' ? {} : { updatedAt: { gte: since } }),
        task: {
          moduleId: { not: null },
          module: {
            course: {
              status: 'PUBLISHED',
              ...(input.language === 'all' ? {} : { language: input.language })
            }
          }
        }
      },
      _count: { _all: true }
    })
    const grouped: AttemptGroupRow[] = groupedRaw
    const sorted = grouped
      .map((row: AttemptGroupRow) => ({ userId: row.userId, count: row._count._all }))
      .sort(
        (a: { userId: string; count: number }, b: { userId: string; count: number }) =>
          b.count - a.count || a.userId.localeCompare(b.userId)
      )
      .slice(0, limit)
    if (sorted.length === 0) return []
    const rankedUsersRaw = await db.user.findMany({
      where: {
        id: { in: sorted.map((row: { userId: string }) => row.userId) },
        deletionRequestedAt: null
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true, totalXp: true }
    })
    const users: LookupUserRow[] = rankedUsersRaw
    const byId = new Map<string, LookupUserRow>(users.map((u: LookupUserRow) => [u.id, u]))
    return sorted
      .map((row: { userId: string; count: number }, index: number) => {
        const user = byId.get(row.userId)
        if (!user) return null
        return {
          rank: index + 1,
          userId: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          xp: row.count * 50,
          tasksSolved: row.count
        }
      })
      .filter((entry): entry is LeaderboardEntry => entry !== null)
  }

  private async computeByCourse(
    input: CourseLeaderboardInput,
    limit: number
  ): Promise<LeaderboardEntry[]> {
    const enrollmentsRaw = await db.enrollment.findMany({
      where: {
        course: { slug: input.courseSlug },
        status: { in: ['ACTIVE', 'FINISHED'] },
        user: { deletionRequestedAt: null }
      },
      orderBy: [{ progressPercent: 'desc' }, { finishedAt: 'asc' }],
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            totalXp: true,
            _count: { select: { taskAttempts: { where: { status: 'SUCCESS' } } } }
          }
        }
      }
    })
    const enrollments: CourseEnrollmentLeaderboardRow[] = enrollmentsRaw
    return enrollments.map((row: CourseEnrollmentLeaderboardRow, index: number) => ({
      rank: index + 1,
      userId: row.user.id,
      username: row.user.username,
      displayName: row.user.displayName,
      avatarUrl: row.user.avatarUrl,
      xp: row.progressPercent * 10,
      tasksSolved: row.user._count.taskAttempts
    }))
  }
}

function startOfWindow(window: LeaderboardWindow): Date {
  const now = Date.now()
  if (window === 'week') return new Date(now - 7 * 86_400_000)
  if (window === 'month') return new Date(now - 30 * 86_400_000)
  return new Date(0)
}

export const leaderboardService = new LeaderboardService()
