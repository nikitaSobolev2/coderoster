import { stubNotImplemented } from './stub'

export interface ProgressRepository {
  saveDraft(userId: string, lessonId: string, code: string): Promise<void>
  getDraft(userId: string, lessonId: string): Promise<string | null>
  markComplete(userId: string, lessonId: string): Promise<{ completed: boolean }>
}

export class FakeProgressRepository implements ProgressRepository {
  private readonly drafts = new Map<string, string>()
  private readonly completed = new Set<string>()

  async saveDraft(userId: string, lessonId: string, code: string): Promise<void> {
    this.drafts.set(this.draftKey(userId, lessonId), code)
  }

  async getDraft(userId: string, lessonId: string): Promise<string | null> {
    return this.drafts.get(this.draftKey(userId, lessonId)) ?? null
  }

  async markComplete(userId: string, lessonId: string): Promise<{ completed: boolean }> {
    this.completed.add(this.draftKey(userId, lessonId))
    return { completed: true }
  }

  private draftKey(userId: string, lessonId: string): string {
    return `${userId}::${lessonId}`
  }
}

export class PrismaProgressRepository implements ProgressRepository {
  saveDraft(): Promise<void> {
    return stubNotImplemented('ProgressRepository.saveDraft')
  }

  getDraft(): Promise<string | null> {
    return stubNotImplemented('ProgressRepository.getDraft')
  }

  markComplete() {
    return stubNotImplemented('ProgressRepository.markComplete')
  }
}
