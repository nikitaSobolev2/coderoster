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
 * Single source of truth for adjusting `User.totalXp`. Base amounts in
 * `XP_REWARDS`; paid plans add `Plan.xpBonusPercent` → increment is
 * round(base * (100 + bonus) / 100).
 */
export class XpService {
  rewardFor(source: XpSource): number {
    return XP_REWARDS[source]
  }

  async award(userId: string, source: XpSource, tx: Tx = db): Promise<number> {
    const base = this.rewardFor(source)
    if (base <= 0) return 0

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { plan: { select: { xpBonusPercent: true } } }
    })
    const bonus = user?.plan?.xpBonusPercent ?? 0
    const increment = Math.round((base * (100 + bonus)) / 100)
    if (increment <= 0) return 0

    await tx.user.update({
      where: { id: userId },
      data: { totalXp: { increment } }
    })
    return increment
  }
}

export const xpService = new XpService()
