import 'server-only'
import type { Prisma, PrismaClient } from '@prisma/client'
import { db } from '~/server/db'

type Tx = Prisma.TransactionClient | PrismaClient

/** Source of an XP delta. Used for analytics + future activity feed entries. */
export type XpSource =
  | 'lesson.passed'
  | 'lesson.completed'
  | 'course.finished'
  | 'daily.cleared'
  | 'weekly.cleared'

const XP_REWARDS: Record<XpSource, number> = {
  'lesson.passed': 50,
  'lesson.completed': 25,
  'course.finished': 500,
  'daily.cleared': 75,
  'weekly.cleared': 350
}

/**
 * Single source of truth for adjusting `User.totalXp`. Concentrating rewards
 * here keeps reward values consistent and lets us tweak the economy later in
 * one place.
 */
export class XpService {
  rewardFor(source: XpSource): number {
    return XP_REWARDS[source]
  }

  async award(userId: string, source: XpSource, tx: Tx = db): Promise<number> {
    const reward = this.rewardFor(source)
    if (reward <= 0) return 0
    await tx.user.update({
      where: { id: userId },
      data: { totalXp: { increment: reward } }
    })
    return reward
  }
}

export const xpService = new XpService()
