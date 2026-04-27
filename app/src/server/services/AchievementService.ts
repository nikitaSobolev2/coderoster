import 'server-only'
import type { Prisma, PrismaClient } from '@prisma/client'
import { db } from '~/server/db'
import {
  achievementRuleRegistry,
  type AchievementRule,
  type AchievementTrigger,
  type RuleContext
} from './achievements/rules'

type Tx = Prisma.TransactionClient | PrismaClient

export interface EvaluateInput {
  userId: string
  trigger: AchievementTrigger
  payload?: Record<string, unknown>
  tx?: Tx
}

export interface UnlockedAchievement {
  slug: string
  earnedAt: Date
}

/**
 * Domain hook called by consumers / mutations on every relevant event. Walks
 * the rule registry, persists progress on `UserAchievementTrack`, and reports
 * which achievements were unlocked this evaluation so callers can fire toasts
 * / activity entries.
 */
export class AchievementService {
  async evaluate(input: EvaluateInput): Promise<UnlockedAchievement[]> {
    const tx = input.tx ?? db
    const rules = achievementRuleRegistry.rulesFor(input.trigger)
    if (rules.length === 0) return []

    const unlocked: UnlockedAchievement[] = []
    for (const rule of rules) {
      const result = await this.applyRule(rule, {
        userId: input.userId,
        trigger: input.trigger,
        payload: input.payload ?? {},
        tx
      })
      if (result) unlocked.push(result)
    }
    return unlocked
  }

  private async applyRule(
    rule: AchievementRule,
    context: RuleContext
  ): Promise<UnlockedAchievement | null> {
    const achievement = await context.tx.achievement.findUnique({ where: { slug: rule.slug } })
    if (!achievement) return null

    const evaluation = await rule.evaluate(context)
    const goal = evaluation.goal ?? achievement.goal ?? 1
    const cappedN = Math.min(evaluation.currentN, goal)

    const existing = await context.tx.userAchievementTrack.findUnique({
      where: { userId_achievementId: { userId: context.userId, achievementId: achievement.id } }
    })

    const wasEarned = existing?.status === 'SUCCESS'
    const willEarn = !wasEarned && evaluation.satisfied
    const earnedAt = willEarn ? new Date() : (existing?.earnedAt ?? null)

    await context.tx.userAchievementTrack.upsert({
      where: {
        userId_achievementId: { userId: context.userId, achievementId: achievement.id }
      },
      update: {
        currentN: cappedN,
        status: wasEarned || willEarn ? 'SUCCESS' : 'ACTIVE',
        earnedAt
      },
      create: {
        userId: context.userId,
        achievementId: achievement.id,
        currentN: cappedN,
        status: willEarn ? 'SUCCESS' : 'ACTIVE',
        earnedAt
      }
    })

    return willEarn && earnedAt ? { slug: rule.slug, earnedAt } : null
  }
}

export const achievementService = new AchievementService()
