import 'server-only'
import type { Prisma, PrismaClient } from '@prisma/client'
import { db } from '~/server/db'

type Tx = Prisma.TransactionClient | PrismaClient

const ONE_DAY_MS = 86_400_000

/**
 * Maintains `User.streakDays` and `User.lastActiveDay`. A streak ticks up by
 * one when the user is active on a calendar day immediately after the last
 * one; same-day re-activity is a no-op; gaps reset to one.
 */
export class StreakService {
  async tick(userId: string, when: Date = new Date(), tx: Tx = db): Promise<number> {
    const today = isoDay(when)
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { streakDays: true, lastActiveDay: true }
    })
    if (!user) return 0
    if (user.lastActiveDay === today) return user.streakDays

    const nextStreak = computeNextStreak(user.lastActiveDay, today, user.streakDays)
    await tx.user.update({
      where: { id: userId },
      data: { streakDays: nextStreak, lastActiveDay: today }
    })
    return nextStreak
  }
}

function computeNextStreak(lastActiveDay: string | null, today: string, current: number): number {
  if (!lastActiveDay) return 1
  const previousDay = isoDayShifted(today, -1)
  return lastActiveDay === previousDay ? current + 1 : 1
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function isoDayShifted(day: string, offsetDays: number): string {
  const base = new Date(`${day}T00:00:00Z`).getTime()
  return isoDay(new Date(base + offsetDays * ONE_DAY_MS))
}

export const streakService = new StreakService()
