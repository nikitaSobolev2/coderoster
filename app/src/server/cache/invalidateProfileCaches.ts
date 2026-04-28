import 'server-only'

import { db } from '~/server/db'
import { cache } from '~/server/cache'
import { cacheKeys } from '~/server/repositories/cached'

/**
 * Busts Redis-backed profile page slices: viewer-specific profile blobs, heatmap,
 * achievements, comments list cursor pages. Prefer this over TTL when data
 * changes (XP, enrollment, achievements, comments).
 */
export async function invalidateProfileCachesForUsername(username: string): Promise<void> {
  const u = username.trim().toLowerCase()
  await Promise.all([
    cache.delPrefix(`profile:${u}:`),
    cache.del(cacheKeys.achievements(username)),
    cache.delPrefix(`activity:${u}:`),
    cache.delPrefix(`comments:${u}:`)
  ])
}

export async function invalidateProfileCachesForUserId(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { username: true }
  })
  if (!user) return
  await invalidateProfileCachesForUsername(user.username)
}

/**
 * Finds the profile wall owner behind `comment.threadId` and clears their caches.
 * Call while the comment row still exists (before delete).
 */
export async function invalidateProfileCachesForCommentId(commentId: string): Promise<void> {
  const row = await db.comment.findUnique({
    where: { id: commentId },
    select: { threadId: true }
  })
  if (!row) return
  const owner = await db.user.findFirst({
    where: { commentsThreadId: row.threadId },
    select: { username: true }
  })
  if (owner) await invalidateProfileCachesForUsername(owner.username)
}
