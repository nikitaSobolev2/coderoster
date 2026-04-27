import 'server-only'
import { db } from '~/server/db'

export interface AdminLeaderboardRow {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  totalXp: number
  excludedFromLeaderboard: boolean
}

export interface AdminGlobalCommentRow {
  id: string
  message: string
  authorUsername: string
  authorDisplayName: string
  threadId: string
  createdAt: Date
}

export class AdminLeaderboardRepository {
  async list(language: string | null = null): Promise<AdminLeaderboardRow[]> {
    const rows = await db.user.findMany({
      where: { totalXp: { gt: 0 } },
      orderBy: { totalXp: 'desc' },
      take: 200,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        totalXp: true,
        excludedFromLeaderboard: true
      }
    })
    void language
    return rows.map(row => ({
      userId: row.id,
      username: row.username,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      totalXp: row.totalXp,
      excludedFromLeaderboard: row.excludedFromLeaderboard
    }))
  }

  async setExclusion(userId: string, excluded: boolean): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: { excludedFromLeaderboard: excluded }
    })
  }
}

export class AdminCommentsRepository {
  async list(query: {
    q?: string
    cursor?: string
    limit?: number
  }): Promise<{ items: AdminGlobalCommentRow[]; nextCursor: string | null }> {
    const limit = Math.min(100, Math.max(1, query.limit ?? 50))
    const where = query.q
      ? { message: { contains: query.q, mode: 'insensitive' as const } }
      : undefined
    const rows = await db.comment.findMany({
      where,
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { username: true, displayName: true } } }
    })
    const hasMore = rows.length > limit
    const sliced = hasMore ? rows.slice(0, limit) : rows
    return {
      items: sliced.map(row => ({
        id: row.id,
        message: row.message,
        authorUsername: row.author.username,
        authorDisplayName: row.author.displayName,
        threadId: row.threadId,
        createdAt: row.createdAt
      })),
      nextCursor: hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null
    }
  }

  async delete(commentId: string): Promise<void> {
    await db.comment.delete({ where: { id: commentId } })
  }
}
