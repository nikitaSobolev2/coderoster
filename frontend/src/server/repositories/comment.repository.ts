import type { ProfileCommentEntry, ProfileCommentsPage } from './types'
import { getFakeComments } from './fixtures'
import { stubNotImplemented } from './stub'

const PAGE_SIZE = 10

export interface CommentRepository {
  listOnProfile(username: string, cursor: string | null): Promise<ProfileCommentsPage>
  post(authorId: string, profileUsername: string, body: string): Promise<ProfileCommentEntry>
  delete(authorId: string, commentId: string): Promise<void>
}

export class FakeCommentRepository implements CommentRepository {
  private readonly entries: ProfileCommentEntry[] = [...getFakeComments()]

  async listOnProfile(_username: string, cursor: string | null): Promise<ProfileCommentsPage> {
    const startIndex = cursor ? this.entries.findIndex(entry => entry.id === cursor) + 1 : 0
    const slice = this.entries.slice(startIndex, startIndex + PAGE_SIZE)
    const next = startIndex + PAGE_SIZE < this.entries.length ? slice[slice.length - 1]!.id : null
    return { items: slice, nextCursor: next }
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
}

export class PrismaCommentRepository implements CommentRepository {
  listOnProfile(): Promise<ProfileCommentsPage> {
    return stubNotImplemented('CommentRepository.listOnProfile')
  }

  post(): Promise<ProfileCommentEntry> {
    return stubNotImplemented('CommentRepository.post')
  }

  delete(): Promise<void> {
    return stubNotImplemented('CommentRepository.delete')
  }
}
