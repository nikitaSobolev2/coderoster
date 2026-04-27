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
    return this.windowedXp(input, limit)
  }

  private async allTimeFromTotalXp(limit: number): Promise<LeaderboardEntry[]> {
    const users = await db.user.findMany({
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
    return users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      xp: user.totalXp,
      tasksSolved: user._count.taskAttempts
    }))
  }

  private async windowedXp(
    input: GlobalLeaderboardInput,
    limit: number
  ): Promise<LeaderboardEntry[]> {
    const since = startOfWindow(input.window)
    const languageFilter = input.language === 'all' ? undefined : { language: input.language }
    const grouped = await db.execution.groupBy({
      by: ['userId'],
      where: {
        passed: true,
        finishedAt: { gte: since },
        ...(languageFilter ?? {})
      },
      _count: { _all: true }
    })
    const sorted = grouped
      .map(row => ({ userId: row.userId, count: row._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
    if (sorted.length === 0) return []
    const users = await db.user.findMany({
      where: { id: { in: sorted.map(row => row.userId) }, deletionRequestedAt: null },
      select: { id: true, username: true, displayName: true, avatarUrl: true, totalXp: true }
    })
    const byId = new Map(users.map(user => [user.id, user]))
    return sorted
      .map((row, index) => {
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
      .filter((row): row is LeaderboardEntry => row !== null)
  }

  private async computeByCourse(
    input: CourseLeaderboardInput,
    limit: number
  ): Promise<LeaderboardEntry[]> {
    const enrollments = await db.enrollment.findMany({
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
    return enrollments.map((row, index) => ({
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
