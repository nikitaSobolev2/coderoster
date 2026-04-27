import 'server-only'
import { db } from '~/server/db'
import { sanitizePlainText } from '~/server/lib/sanitize'
import { toProfileComment } from './mappers'
import type { ProfileCommentEntry, ProfileCommentsPage } from './types'
import { getFakeComments } from './fixtures'

const PAGE_SIZE = 10

export interface CommentRepository {
  listOnProfile(username: string, cursor: string | null): Promise<ProfileCommentsPage>
  post(authorId: string, profileUsername: string, body: string): Promise<ProfileCommentEntry>
  delete(authorId: string, commentId: string): Promise<void>
  like(authorId: string, commentId: string, vote: 'like' | 'dislike'): Promise<void>
}

export class FakeCommentRepository implements CommentRepository {
  private readonly entries: ProfileCommentEntry[] = [...getFakeComments()]

  async listOnProfile(_username: string, cursor: string | null): Promise<ProfileCommentsPage> {
    const startIndex = cursor ? this.entries.findIndex(entry => entry.id === cursor) + 1 : 0
    const slice = this.entries.slice(startIndex, startIndex + PAGE_SIZE)
    const nextCursor =
      startIndex + PAGE_SIZE < this.entries.length ? slice[slice.length - 1]!.id : null
    return { items: slice, nextCursor }
  }

  async post(
    authorId: string,
    _profileUsername: string,
    body: string
  ): Promise<ProfileCommentEntry> {
    const entry: ProfileCommentEntry = {
      id: `c-${Date.now()}`,
      authorUsername: authorId,
      authorDisplayName: authorId,
      authorAvatarUrl: null,
      body,
      createdAt: new Date()
    }
    this.entries.unshift(entry)
    return entry
  }

  async delete(_authorId: string, commentId: string): Promise<void> {
    const index = this.entries.findIndex(entry => entry.id === commentId)
    if (index >= 0) this.entries.splice(index, 1)
  }

  async like(): Promise<void> {
    /* fakes do not track votes */
  }
}

export class PrismaCommentRepository implements CommentRepository {
  async listOnProfile(username: string, cursor: string | null): Promise<ProfileCommentsPage> {
    const owner = await db.user.findUnique({
      where: { username },
      select: { commentsThreadId: true }
    })
    if (!owner?.commentsThreadId) return { items: [], nextCursor: null }
    const comments = await db.comment.findMany({
      where: { threadId: owner.commentsThreadId },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0
    })
    const hasMore = comments.length > PAGE_SIZE
    const items = (hasMore ? comments.slice(0, PAGE_SIZE) : comments).map(toProfileComment)
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null
    return { items, nextCursor }
  }

  async post(
    authorId: string,
    profileUsername: string,
    body: string
  ): Promise<ProfileCommentEntry> {
    const sanitized = sanitizePlainText(body)
    return db.$transaction(async tx => {
      const owner = await tx.user.findUniqueOrThrow({
        where: { username: profileUsername },
        select: { id: true, commentsThreadId: true }
      })
      let threadId = owner.commentsThreadId
      if (!threadId) {
        const thread = await tx.thread.create({ data: {} })
        threadId = thread.id
        await tx.user.update({
          where: { id: owner.id },
          data: { commentsThreadId: thread.id }
        })
      }
      const created = await tx.comment.create({
        data: { authorId, threadId, message: sanitized },
        include: { author: true }
      })
      await tx.thread.update({
        where: { id: threadId },
        data: { totalCount: { increment: 1 } }
      })
      return toProfileComment(created)
    })
  }

  async delete(authorId: string, commentId: string): Promise<void> {
    await db.$transaction(async tx => {
      const comment = await tx.comment.findFirst({ where: { id: commentId, authorId } })
      if (!comment) return
      await tx.comment.delete({ where: { id: commentId } })
      await tx.thread.update({
        where: { id: comment.threadId },
        data: { totalCount: { decrement: 1 } }
      })
    })
  }

  async like(_authorId: string, commentId: string, vote: 'like' | 'dislike'): Promise<void> {
    const column = vote === 'like' ? 'likesN' : 'dislikesN'
    await db.$transaction(async tx => {
      await tx.$executeRawUnsafe(`SELECT id FROM "Comment" WHERE id = $1 FOR UPDATE`, commentId)
      await tx.comment.update({
        where: { id: commentId },
        data: { [column]: { increment: 1 } }
      })
    })
  }
}
