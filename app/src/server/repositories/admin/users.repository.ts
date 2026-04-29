import 'server-only'
import { type Prisma, type Role } from '@prisma/client'
import { db } from '~/server/db'
import { sanitizePlainText } from '~/server/lib/sanitize'

export type AdminUserRoleInput = 'LEARNER' | 'AUTHOR' | 'MODERATOR' | 'ADMIN'

export interface AdminUserListQuery {
  q?: string
  role?: AdminUserRoleInput
  banned?: 'all' | 'banned' | 'active'
  cursor?: string
  limit?: number
}

export interface AdminUserSummary {
  id: string
  username: string
  displayName: string
  email: string
  role: AdminUserRoleInput
  totalXp: number
  streakDays: number
  bannedUntil: Date | null
  banReason: string | null
  excludedFromLeaderboard: boolean
  joinedAt: Date
}

export interface AdminUserListResult {
  items: AdminUserSummary[]
  nextCursor: string | null
  total: number
}

export interface AdminUserDetail extends AdminUserSummary {
  bio: string
  avatarUrl: string | null
  socials: Record<string, string>
  appearance: Record<string, unknown>
  firstName: string | null
  lastName: string | null
  deletionRequestedAt: Date | null
  chatBannedUntil: Date | null
  chatBanReason: string | null
  counts: {
    enrollments: number
    executions: number
    comments: number
    activities: number
  }
}

export interface AdminUserUpdateInput {
  displayName?: string
  username?: string
  email?: string
  role?: AdminUserRoleInput
  bio?: string
  avatarUrl?: string | null
  totalXp?: number
  streakDays?: number
  excludedFromLeaderboard?: boolean
}

export interface AdminUserBanInput {
  /** ISO date string. Pass the literal `'permanent'` for forever bans (year 9999). */
  until: string
  reason: string
}

export interface AdminUserActivityEntry {
  id: string
  type: string
  payload: unknown
  createdAt: Date
}

export interface AdminUserCommentEntry {
  id: string
  message: string
  threadId: string
  createdAt: Date
}

const PERMANENT_BAN_DATE = new Date('9999-12-31T23:59:59Z')
const DEFAULT_LIMIT = 30

export class AdminUsersRepository {
  async list(query: AdminUserListQuery): Promise<AdminUserListResult> {
    const where = buildListWhere(query)
    const limit = clampLimit(query.limit)
    const [rows, total] = await Promise.all([
      db.user.findMany({
        where,
        take: limit + 1,
        cursor: query.cursor ? { id: query.cursor } : undefined,
        skip: query.cursor ? 1 : 0,
        orderBy: { joinedAt: 'desc' }
      }),
      db.user.count({ where })
    ])
    const hasMore = rows.length > limit
    const sliced = hasMore ? rows.slice(0, limit) : rows
    return {
      items: sliced.map(toSummary),
      nextCursor: hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null,
      total
    }
  }

  async get(id: string): Promise<AdminUserDetail> {
    const user = await db.user.findUniqueOrThrow({
      where: { id },
      include: {
        _count: {
          select: {
            enrollments: true,
            executions: true,
            comments: true,
            activities: true
          }
        }
      }
    })
    return {
      ...toSummary(user),
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      socials: (user.socials ?? {}) as Record<string, string>,
      appearance: (user.appearance ?? {}) as Record<string, unknown>,
      firstName: user.firstName,
      lastName: user.lastName,
      deletionRequestedAt: user.deletionRequestedAt,
      chatBannedUntil: user.chatBannedUntil,
      chatBanReason: user.chatBanReason,
      counts: {
        enrollments: user._count.enrollments,
        executions: user._count.executions,
        comments: user._count.comments,
        activities: user._count.activities
      }
    }
  }

  async update(id: string, input: AdminUserUpdateInput): Promise<AdminUserDetail> {
    const data: Prisma.UserUpdateInput = {}
    if (input.displayName !== undefined) data.displayName = sanitizePlainText(input.displayName)
    if (input.username !== undefined) data.username = input.username
    if (input.email !== undefined) data.email = input.email.toLowerCase()
    if (input.role !== undefined) data.role = input.role
    if (input.bio !== undefined) data.bio = sanitizePlainText(input.bio)
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl
    if (input.totalXp !== undefined) data.totalXp = input.totalXp
    if (input.streakDays !== undefined) data.streakDays = input.streakDays
    if (input.excludedFromLeaderboard !== undefined) {
      data.excludedFromLeaderboard = input.excludedFromLeaderboard
    }
    await db.user.update({ where: { id }, data })
    return this.get(id)
  }

  async ban(id: string, input: AdminUserBanInput): Promise<AdminUserDetail> {
    const until = input.until === 'permanent' ? PERMANENT_BAN_DATE : new Date(input.until)
    if (Number.isNaN(until.getTime())) {
      throw new Error('Invalid ban date')
    }
    await db.user.update({
      where: { id },
      data: {
        bannedUntil: until,
        banReason: sanitizePlainText(input.reason).slice(0, 500)
      }
    })
    return this.get(id)
  }

  async unban(id: string): Promise<AdminUserDetail> {
    await db.user.update({
      where: { id },
      data: { bannedUntil: null, banReason: null }
    })
    return this.get(id)
  }

  async chatMute(id: string, input: AdminUserBanInput): Promise<AdminUserDetail> {
    const until = input.until === 'permanent' ? PERMANENT_BAN_DATE : new Date(input.until)
    if (Number.isNaN(until.getTime())) {
      throw new Error('Invalid ban date')
    }
    await db.user.update({
      where: { id },
      data: {
        chatBannedUntil: until,
        chatBanReason: sanitizePlainText(input.reason).slice(0, 500)
      }
    })
    return this.get(id)
  }

  async chatUnmute(id: string): Promise<AdminUserDetail> {
    await db.user.update({
      where: { id },
      data: { chatBannedUntil: null, chatBanReason: null }
    })
    return this.get(id)
  }

  async grantAchievement(userId: string, achievementId: string): Promise<void> {
    await db.userAchievementTrack.upsert({
      where: { userId_achievementId: { userId, achievementId } },
      update: { status: 'SUCCESS', earnedAt: new Date() },
      create: {
        userId,
        achievementId,
        status: 'SUCCESS',
        earnedAt: new Date(),
        currentN: 1
      }
    })
  }

  async revokeAchievement(userId: string, achievementId: string): Promise<void> {
    await db.userAchievementTrack
      .delete({ where: { userId_achievementId: { userId, achievementId } } })
      .catch(() => {
        /* noop: idempotent */
      })
  }

  async listActivity(
    userId: string,
    cursor: string | null,
    limit = 50
  ): Promise<{ items: AdminUserActivityEntry[]; nextCursor: string | null }> {
    const rows = await db.userActivity.findMany({
      where: { userId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' }
    })
    const hasMore = rows.length > limit
    const sliced = hasMore ? rows.slice(0, limit) : rows
    return {
      items: sliced.map(row => ({
        id: row.id,
        type: row.type,
        payload: row.payload,
        createdAt: row.createdAt
      })),
      nextCursor: hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null
    }
  }

  async deleteActivity(activityId: string): Promise<void> {
    await db.userActivity.delete({ where: { id: activityId } }).catch(() => {
      /* noop */
    })
  }

  async listAchievementStatus(userId: string): Promise<
    {
      id: string
      slug: string
      title: string
      category: string
      rarity: string
      hidden: boolean
      earned: boolean
      earnedAt: Date | null
    }[]
  > {
    const [achievements, tracks] = await Promise.all([
      db.achievement.findMany({ orderBy: [{ category: 'asc' }, { title: 'asc' }] }),
      db.userAchievementTrack.findMany({ where: { userId } })
    ])
    const trackMap = new Map(tracks.map(track => [track.achievementId, track]))
    return achievements.map(achievement => {
      const track = trackMap.get(achievement.id)
      return {
        id: achievement.id,
        slug: achievement.slug,
        title: achievement.title,
        category: achievement.category,
        rarity: achievement.rarity,
        hidden: achievement.hidden,
        earned: track?.status === 'SUCCESS',
        earnedAt: track?.earnedAt ?? null
      }
    })
  }

  async listComments(
    userId: string,
    cursor: string | null,
    limit = 50
  ): Promise<{ items: AdminUserCommentEntry[]; nextCursor: string | null }> {
    const rows = await db.comment.findMany({
      where: { authorId: userId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' }
    })
    const hasMore = rows.length > limit
    const sliced = hasMore ? rows.slice(0, limit) : rows
    return {
      items: sliced.map(row => ({
        id: row.id,
        message: row.message,
        threadId: row.threadId,
        createdAt: row.createdAt
      })),
      nextCursor: hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null
    }
  }
}

function buildListWhere(query: AdminUserListQuery): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {}
  if (query.role) where.role = query.role
  if (query.banned === 'banned') where.bannedUntil = { gt: new Date() }
  if (query.banned === 'active') {
    where.OR = [{ bannedUntil: null }, { bannedUntil: { lte: new Date() } }]
  }
  if (query.q && query.q.length > 0) {
    const q = query.q
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      }
    ]
  }
  return where
}

function toSummary(user: {
  id: string
  username: string
  displayName: string
  email: string
  role: Role
  totalXp: number
  streakDays: number
  bannedUntil: Date | null
  banReason: string | null
  excludedFromLeaderboard: boolean
  joinedAt: Date
}): AdminUserSummary {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    totalXp: user.totalXp,
    streakDays: user.streakDays,
    bannedUntil: user.bannedUntil,
    banReason: user.banReason,
    excludedFromLeaderboard: user.excludedFromLeaderboard,
    joinedAt: user.joinedAt
  }
}

function clampLimit(limit: number | undefined): number {
  if (!limit) return DEFAULT_LIMIT
  return Math.min(100, Math.max(1, limit))
}
