import type { ActivityCell } from '~/server/repositories/types'

/**
 * Heatmap intensity bucketing — matches `activitySnapshot` cron and fake fixtures.
 */
export function levelForActivityCount(count: number): ActivityCell['level'] {
  if (count <= 0) return 0
  if (count <= 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}
