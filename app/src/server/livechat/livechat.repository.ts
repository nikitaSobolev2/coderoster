import 'server-only'

import { LivechatAuthorKind } from '@prisma/client'
import { db } from '~/server/db'
import {
  LIVECHAT_DEFAULT_USERNAME_COLOR,
  LIVECHAT_USERNAME_COLOR_SWATCHES,
  type LivechatUsernameColorToken
} from '~/shared/constants/livechatColors'

export interface LivechatMessageDTO {
  id: string
  createdAt: Date
  body: string
  authorKind: 'AUTH' | 'GUEST'
  authorLabel: string
  usernameColor: string
  /** Login handle for `/u/[username]`; null for guests and if user row missing. */
  authorProfileUsername: string | null
}

type LivechatRowWithAuthor = {
  id: string
  createdAt: Date
  body: string
  authorKind: LivechatAuthorKind
  authorLabel: string
  usernameColor: string
  user: { username: string } | null
}

export function isAllowedUsernameColor(value: string): value is LivechatUsernameColorToken {
  return (LIVECHAT_USERNAME_COLOR_SWATCHES as readonly string[]).includes(value)
}

export class LivechatRepository {
  async listOlderThan(
    cursorOlderId: string | null,
    limit: number
  ): Promise<{
    items: LivechatMessageDTO[]
    nextCursorOlder: string | null
  }> {
    const take = Math.min(Math.max(limit, 1), 80)
    const anchor =
      cursorOlderId !== null
        ? await db.livechatMessage.findUnique({
            where: { id: cursorOlderId },
            select: { id: true, createdAt: true }
          })
        : null

    if (cursorOlderId !== null && anchor === null) {
      return { items: [], nextCursorOlder: null }
    }

    const rows = await db.livechatMessage.findMany({
      where:
        anchor !== null
          ? {
              OR: [
                { createdAt: { lt: anchor.createdAt } },
                {
                  AND: [{ createdAt: anchor.createdAt }, { id: { lt: anchor.id } }]
                }
              ]
            }
          : {},
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      include: { user: { select: { username: true } } }
    })

    const hasMore = rows.length > take
    const slice = hasMore ? rows.slice(0, take) : rows
    const chronological = [...slice].reverse()
    const oldestInBatch = slice[slice.length - 1]

    return {
      items: chronological.map(toDto),
      nextCursorOlder: hasMore && oldestInBatch ? oldestInBatch.id : null
    }
  }

  async listRecent(limit = 50): Promise<{
    items: LivechatMessageDTO[]
    nextCursorOlder: string | null
  }> {
    const take = Math.min(limit, 80)
    const rows = await db.livechatMessage.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      include: { user: { select: { username: true } } }
    })
    const hasMoreOlder = rows.length > take
    const slice = hasMoreOlder ? rows.slice(0, take) : rows
    const chronological = [...slice].reverse()
    const oldestId = slice[slice.length - 1]?.id ?? null

    return {
      items: chronological.map(toDto),
      nextCursorOlder: hasMoreOlder && oldestId ? oldestId : null
    }
  }

  async guestHasConsent(guestSessionId: string): Promise<boolean> {
    const row = await db.livechatGuestConsent.findUnique({
      where: { guestSessionId },
      select: { guestSessionId: true }
    })
    return Boolean(row)
  }

  async recordGuestConsent(guestSessionId: string): Promise<void> {
    await db.livechatGuestConsent.upsert({
      where: { guestSessionId },
      update: {},
      create: { guestSessionId }
    })
  }

  async insertAuthMessage(params: {
    userId: string
    body: string
    authorLabel: string
    usernameColor: LivechatUsernameColorToken
  }): Promise<LivechatMessageDTO> {
    const row = await db.livechatMessage.create({
      data: {
        body: params.body,
        authorKind: LivechatAuthorKind.AUTH,
        userId: params.userId,
        guestSessionId: null,
        authorLabel: params.authorLabel,
        usernameColor: params.usernameColor
      },
      include: { user: { select: { username: true } } }
    })
    return toDto(row)
  }

  async insertGuestMessage(params: {
    guestSessionId: string
    body: string
    guestLabel: string
    usernameColor: LivechatUsernameColorToken
  }): Promise<LivechatMessageDTO> {
    const row = await db.livechatMessage.create({
      data: {
        body: params.body,
        authorKind: LivechatAuthorKind.GUEST,
        userId: null,
        guestSessionId: params.guestSessionId,
        authorLabel: params.guestLabel,
        usernameColor: params.usernameColor
      },
      include: { user: { select: { username: true } } }
    })
    return toDto(row)
  }

  async acceptUserConsent(userId: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: { livechatConsentAt: new Date() }
    })
  }

  async setUserUsernameColor(userId: string, color: LivechatUsernameColorToken): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: { livechatUsernameColor: color }
    })
  }
}

function toDto(row: LivechatRowWithAuthor): LivechatMessageDTO {
  const authorKind = row.authorKind === LivechatAuthorKind.AUTH ? 'AUTH' : 'GUEST'
  const authorProfileUsername =
    authorKind === 'AUTH' && row.user?.username ? row.user.username : null
  return {
    id: row.id,
    createdAt: row.createdAt,
    body: row.body,
    authorKind,
    authorLabel: row.authorLabel,
    usernameColor: row.usernameColor || LIVECHAT_DEFAULT_USERNAME_COLOR,
    authorProfileUsername
  }
}
