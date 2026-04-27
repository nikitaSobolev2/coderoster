import 'server-only'
import type { Prisma } from '@prisma/client'
import { db } from '~/server/db'

export interface AccountDeletionRequest {
  queued: true
  scheduledAt: Date
}

export interface AccountRepository {
  requestDeletion(userId: string): Promise<AccountDeletionRequest>
}

const TOPIC = 'account.deletion.requested'

export class FakeAccountRepository implements AccountRepository {
  async requestDeletion(_userId: string): Promise<AccountDeletionRequest> {
    return { queued: true, scheduledAt: new Date() }
  }
}

export class PrismaAccountRepository implements AccountRepository {
  async requestDeletion(userId: string): Promise<AccountDeletionRequest> {
    const now = new Date()
    await db.$transaction(async tx => {
      await tx.user.update({
        where: { id: userId },
        data: { deletionRequestedAt: now }
      })
      await tx.outboxEvent.create({
        data: {
          topic: TOPIC,
          payload: {
            userId,
            requestedAt: now.toISOString()
          } satisfies Prisma.InputJsonValue
        }
      })
    })
    return { queued: true, scheduledAt: now }
  }
}
