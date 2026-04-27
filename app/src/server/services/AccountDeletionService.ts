import 'server-only'
import { db } from '~/server/db'
import { userSyncService } from './UserSyncService'

/**
 * Performs the irreversible side of account deletion. Called from the broker
 * consumer so the network round-trip and the DB cascade happen out of the
 * request/response cycle. Most relations cascade via Prisma `onDelete`;
 * comments are kept (anonymised by deleting their author cascades them too,
 * but profile threads survive because they belong to the visited user).
 */
export class AccountDeletionService {
  async delete(userId: string): Promise<{ workosUserId: string | null }> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, workosUserId: true }
    })
    if (!user) return { workosUserId: null }

    await db.user.delete({ where: { id: userId } })
    await userSyncService.invalidate(user.workosUserId)
    return { workosUserId: user.workosUserId }
  }
}

export const accountDeletionService = new AccountDeletionService()
