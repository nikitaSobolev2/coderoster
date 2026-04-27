import 'server-only'
import { db } from '~/server/db'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { toEarnedAchievement } from '~/server/repositories/mappers'
import type { EarnedAchievement } from '~/server/repositories/types'

export interface AchievementProgress extends EarnedAchievement {
  currentN: number
  goal: number
  active: boolean
}

/**
 * Browser-facing slice of the achievements engine. `listMine` walks every
 * `Achievement` row, joins the viewer's `UserAchievementTrack`, and surfaces
 * progress so the UI can render progress bars even on locked tiles.
 */
export const achievementRouter = createTRPCRouter({
  listAll: publicProcedure.query(async () => {
    const achievements = await db.achievement.findMany({ orderBy: { createdAt: 'asc' } })
    return achievements.map(achievement => toEarnedAchievement(achievement, null))
  }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const achievements = await db.achievement.findMany({ orderBy: { createdAt: 'asc' } })
    const tracks = await db.userAchievementTrack.findMany({ where: { userId: ctx.user.id } })
    const byId = new Map(tracks.map(track => [track.achievementId, track]))
    return achievements.map(achievement => {
      const track = byId.get(achievement.id) ?? null
      const base = toEarnedAchievement(achievement, track)
      const goal = achievement.goal ?? 1
      const currentN = Math.min(track?.currentN ?? 0, goal)
      const progress: AchievementProgress = {
        ...base,
        goal,
        currentN,
        active: track?.status === 'ACTIVE'
      }
      return progress
    })
  })
})
