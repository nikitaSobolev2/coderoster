import 'server-only'
import { db } from '~/server/db'

export interface AdminAuditRow {
  id: string
  actorId: string | null
  actorUsername: string | null
  action: string
  targetType: string
  targetId: string
  diff: unknown
  createdAt: Date
}

export interface AdminAuditQuery {
  actorId?: string
  targetType?: string
  targetId?: string
  cursor?: string
  limit?: number
}

export class AdminAuditRepository {
  async list(
    query: AdminAuditQuery
  ): Promise<{ items: AdminAuditRow[]; nextCursor: string | null }> {
    const limit = Math.min(200, Math.max(1, query.limit ?? 50))
    const where = {
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.targetId ? { targetId: query.targetId } : {})
    }
    const rows = await db.auditLog.findMany({
      where,
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { username: true } } }
    })
    const hasMore = rows.length > limit
    const sliced = hasMore ? rows.slice(0, limit) : rows
    return {
      items: sliced.map(row => ({
        id: row.id,
        actorId: row.actorId,
        actorUsername: row.actor?.username ?? null,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        diff: row.diff,
        createdAt: row.createdAt
      })),
      nextCursor: hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null
    }
  }
}
