import 'server-only'
import { Prisma } from '@prisma/client'
import { db } from '~/server/db'
import { levelForActivityCount } from '~/server/lib/activityHeatmapLevel'
import { findUserByUsernameLoose } from '~/server/lib/userLookup'
import {
  calculateProfileStats,
  toActivityCell,
  toEarnedAchievement,
  toPublicProfile
} from './mappers'
import type { ActivityCell, EarnedAchievement, PublicProfile } from './types'
import { getFakeAchievements, getFakeActivity, getFakeProfile } from './fixtures'

type PgDateRow = { d: string }
type PgCountRow = { c: bigint }

export interface ProfileRepository {
  getByUsername(username: string, viewerUserId: string | null): Promise<PublicProfile | null>
  getActivity(username: string, year: number): Promise<ActivityCell[]>
  getAchievements(username: string): Promise<EarnedAchievement[]>
}

export class FakeProfileRepository implements ProfileRepository {
  async getByUsername(
    username: string,
    viewerUserId: string | null
  ): Promise<PublicProfile | null> {
    const profile = getFakeProfile(username.trim())
    if (!profile) return null
    return { ...profile, isOwner: viewerUserId === profile.id }
  }

  async getActivity(_username: string, year: number): Promise<ActivityCell[]> {
    return getFakeActivity(year)
  }

  async getAchievements(username: string): Promise<EarnedAchievement[]> {
    return getFakeAchievements(username)
  }
}

export class PrismaProfileRepository implements ProfileRepository {
  async getByUsername(
    username: string,
    viewerUserId: string | null
  ): Promise<PublicProfile | null> {
    const user = await findUserByUsernameLoose(username)
    if (!user) return null
    const stats = await this.computeStats(user.id)
    const plan = user.planId
      ? await db.plan.findUnique({
          where: { id: user.planId },
          select: { slug: true, name: true, tierLevel: true }
        })
      : null
    return toPublicProfile(user, stats, viewerUserId === user.id, plan)
  }

  async getActivity(username: string, year: number): Promise<ActivityCell[]> {
    const user = await findUserByUsernameLoose(username)
    if (!user) return []
    const start = `${year}-01-01`
    const end = `${year}-12-31`

    const todayRows = await db.$queryRaw<PgDateRow[]>(
      Prisma.sql`SELECT to_char(CURRENT_DATE, 'YYYY-MM-DD') AS d`
    )
    const pgToday = todayRows[0]?.d
    if (!pgToday) return []

    const todayInSelectedYear = pgToday >= start && pgToday <= end

    const [snapshots, liveTodayRows] = await Promise.all([
      db.userActivitySnapshot.findMany({
        where: {
          userId: user.id,
          date: { gte: start, lte: end },
          ...(todayInSelectedYear ? { NOT: { date: pgToday } } : {})
        },
        orderBy: { date: 'asc' }
      }),
      todayInSelectedYear
        ? db.$queryRaw<PgCountRow[]>(
            Prisma.sql`
            SELECT COUNT(*)::bigint AS c
            FROM "UserActivity"
            WHERE "userId" = ${user.id}
              AND "createdAt"::date = CURRENT_DATE`
          )
        : Promise.resolve(null)
    ])

    const cells: ActivityCell[] = snapshots.map(toActivityCell)

    if (todayInSelectedYear && liveTodayRows) {
      const count = Number(liveTodayRows[0]?.c ?? 0)
      cells.push({
        date: pgToday,
        count,
        level: levelForActivityCount(count)
      })
      cells.sort((a, b) => a.date.localeCompare(b.date))
    }

    return cells
  }

  async getAchievements(username: string): Promise<EarnedAchievement[]> {
    const user = await findUserByUsernameLoose(username)
    const achievements = await db.achievement.findMany({ orderBy: { createdAt: 'asc' } })
    if (!user) return achievements.map(a => toEarnedAchievement(a, null))
    const tracks = await db.userAchievementTrack.findMany({ where: { userId: user.id } })
    const trackByAchievementId = new Map(tracks.map(track => [track.achievementId, track]))
    return achievements.map(achievement =>
      toEarnedAchievement(achievement, trackByAchievementId.get(achievement.id) ?? null)
    )
  }

  private async computeStats(userId: string) {
    const [user, coursesCompleted, coursesActive, tasksSolved] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { totalXp: true, streakDays: true }
      }),
      db.enrollment.count({ where: { userId, status: 'FINISHED' } }),
      db.enrollment.count({ where: { userId, status: 'ACTIVE' } }),
      db.courseTaskAttempt.count({ where: { userId, status: 'SUCCESS' } })
    ])
    return calculateProfileStats({
      totalXp: user?.totalXp ?? 0,
      streakDays: user?.streakDays ?? 0,
      coursesCompleted,
      coursesActive,
      tasksSolved
    })
  }
}
