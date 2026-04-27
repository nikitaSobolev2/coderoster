import 'server-only'
import cron from 'node-cron'
import { Prisma } from '@prisma/client'
import { env } from '~/env'
import { db } from '~/server/db'

interface AggregateRow {
  userId: string
  date: string
  count: bigint
}

/**
 * Aggregates the previous calendar day's `UserActivity` rows into
 * `UserActivitySnapshot`. Idempotent: re-running the same day reuses the same
 * key and updates the count + level.
 */
export async function snapshotPreviousDay(): Promise<void> {
  const day = previousDay()
  const rows = await db.$queryRaw<AggregateRow[]>(Prisma.sql`
    SELECT
      "userId" AS "userId",
      to_char("createdAt"::date, 'YYYY-MM-DD') AS "date",
      COUNT(*) AS "count"
    FROM "UserActivity"
    WHERE "createdAt"::date = ${day}::date
    GROUP BY "userId", "date"
  `)
  for (const row of rows) {
    const count = Number(row.count)
    await db.userActivitySnapshot.upsert({
      where: { userId_date: { userId: row.userId, date: row.date } },
      update: { count, level: levelFor(count) },
      create: {
        userId: row.userId,
        date: row.date,
        count,
        level: levelFor(count)
      }
    })
  }
  console.log(`[snapshot] processed ${rows.length} users for ${day}`)
}

function previousDay(): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

function levelFor(count: number): number {
  if (count === 0) return 0
  if (count <= 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

export function scheduleActivitySnapshot(): void {
  console.log(`[snapshot] scheduled at ${env.ACTIVITY_SNAPSHOT_CRON} UTC`)
  cron.schedule(
    env.ACTIVITY_SNAPSHOT_CRON,
    () => {
      snapshotPreviousDay().catch(error => console.error('[snapshot] failed', error))
    },
    { timezone: 'UTC' }
  )
}

if (import.meta.url.startsWith('file:') && process.argv[1]?.endsWith('activitySnapshot.ts')) {
  if (process.argv.includes('--once')) {
    snapshotPreviousDay()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('[snapshot] fatal', error)
        process.exit(1)
      })
  } else {
    scheduleActivitySnapshot()
  }
}
