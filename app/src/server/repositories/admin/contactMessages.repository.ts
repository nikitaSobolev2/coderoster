import 'server-only'

import type { ContactMessageSource } from '@prisma/client'

import { db } from '~/server/db'

export interface AdminContactMessageRow {
  id: string
  source: ContactMessageSource
  name: string
  email: string
  message: string
  createdAt: Date
}

export class AdminContactMessagesRepository {
  async list(query: {
    cursor?: string
    limit?: number
  }): Promise<{ items: AdminContactMessageRow[]; nextCursor: string | null }> {
    const limit = Math.min(100, Math.max(1, query.limit ?? 50))
    const rows = await db.contactMessage.findMany({
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        source: true,
        name: true,
        email: true,
        message: true,
        createdAt: true
      }
    })
    const hasMore = rows.length > limit
    const sliced = hasMore ? rows.slice(0, limit) : rows
    return {
      items: sliced,
      nextCursor: hasMore ? sliced[sliced.length - 1]?.id ?? null : null
    }
  }
}
