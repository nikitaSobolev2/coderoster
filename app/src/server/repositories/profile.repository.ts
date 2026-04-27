import 'server-only'
import { db } from '~/server/db'
import {
  calculateProfileStats,
  toActivityCell,
  toEarnedAchievement,
  toPublicProfile
} from './mappers'
import type { ActivityCell, EarnedAchievement, PublicProfile } from './types'
import { getFakeAchievements, getFakeActivity, getFakeProfile } from './fixtures'

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
    const profile = getFakeProfile(username)
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
    const user = await db.user.findUnique({ where: { username } })
    if (!user) return null
    const stats = await this.computeStats(user.id)
    return toPublicProfile(user, stats, viewerUserId === user.id)
  }

  async getActivity(username: string, year: number): Promise<ActivityCell[]> {
    const user = await db.user.findUnique({ where: { username } })
    if (!user) return []
    const start = `${year}-01-01`
    const end = `${year}-12-31`
    const snapshots = await db.userActivitySnapshot.findMany({
      where: { userId: user.id, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' }
    })
    return snapshots.map(toActivityCell)
  }

  async getAchievements(username: string): Promise<EarnedAchievement[]> {
    const user = await db.user.findUnique({ where: { username } })
    const achievements = await db.achievement.findMany({ orderBy: { createdAt: 'asc' } })
    if (!user) return achievements.map(a => toEarnedAchievement(a, null))
    const tracks = await db.userAchievementTrack.findMany({ where: { userId: user.id } })
    const trackByAchievementId = new Map(tracks.map(track => [track.achievementId, track]))
    return achievements.map(achievement =>
      toEarnedAchievement(achievement, trackByAchievementId.get(achievement.id) ?? null)
    )
  }

  private async computeStats(userId: string) {
    const [coursesCompleted, coursesActive, tasksSolved, totalXpResult] = await Promise.all([
      db.enrollment.count({ where: { userId, status: 'FINISHED' } }),
      db.enrollment.count({ where: { userId, status: 'ACTIVE' } }),
      db.courseTaskAttempt.count({ where: { userId, status: 'SUCCESS' } }),
      db.enrollment.aggregate({
        _sum: { progressPercent: true },
        where: { userId, status: { in: ['ACTIVE', 'FINISHED'] } }
      })
    ])
    const totalXp = (totalXpResult._sum.progressPercent ?? 0) * 10 + tasksSolved * 50
    return calculateProfileStats({
      totalXp,
      streakDays: 0,
      coursesCompleted,
      coursesActive,
      tasksSolved
    })
  }
}
