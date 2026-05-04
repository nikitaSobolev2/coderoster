import 'server-only'
import type { User } from '@prisma/client'
import { Role } from '@prisma/client'
import { isBootstrapAdminEmail } from '~/server/auth/bootstrapAdminEmail'
import { db } from '~/server/db'
import { sanitizePlainText } from '~/server/lib/sanitize'

export interface WorkosUserSnapshot {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  profilePictureUrl: string | null
}

export interface UserSyncOptions {
  /** Set when the row is created or backfilled right after signup (local consent checkbox). */
  personalDataProcessingConsentAt?: Date
}

/**
 * Resolves a WorkOS-authenticated session to the local `User` row, creating
 * it on first sight. Reads come straight from Postgres (single indexed
 * `findUnique` on `workosUserId`); we deliberately avoid caching the result
 * because the row mutates often (settings updates, achievement progression)
 * and a stale cache caused the "nav shows username A, settings shows username
 * B" inconsistency we used to hit.
 */
export class UserSyncService {
  async syncFromSession(workosUser: WorkosUserSnapshot, options?: UserSyncOptions): Promise<User> {
    const existing = await db.user.findUnique({ where: { workosUserId: workosUser.id } })
    if (existing) {
      if (
        options?.personalDataProcessingConsentAt &&
        existing.personalDataProcessingConsentAt === null
      ) {
        return db.user.update({
          where: { id: existing.id },
          data: { personalDataProcessingConsentAt: options.personalDataProcessingConsentAt }
        })
      }
      return existing
    }
    return this.createNew(workosUser, options)
  }

  /**
   * Cache invalidation hook kept on the public surface for backward
   * compatibility with callers (settings update, account deletion). It is a
   * no-op now that reads are uncached, but a no-op is safer than removing the
   * symbol and inviting accidental re-introduction of stale state.
   */
  async invalidate(_workosUserId: string): Promise<void> {
    /* no-op — reads are not cached */
  }

  private async createNew(
    workosUser: WorkosUserSnapshot,
    options?: UserSyncOptions
  ): Promise<User> {
    const username = await this.resolveUniqueUsername(workosUser.email)
    const displayName = sanitizePlainText(buildDisplayName(workosUser))
    const role = isBootstrapAdminEmail(workosUser.email) ? Role.ADMIN : Role.LEARNER
    const defaultPlan = await db.plan.findFirst({
      where: { isDefaultFree: true },
      select: { id: true }
    })
    return db.user.create({
      data: {
        workosUserId: workosUser.id,
        email: workosUser.email,
        username,
        displayName,
        firstName: workosUser.firstName,
        lastName: workosUser.lastName,
        avatarUrl: workosUser.profilePictureUrl,
        role,
        planId: defaultPlan?.id ?? undefined,
        personalDataProcessingConsentAt: options?.personalDataProcessingConsentAt ?? undefined
      }
    })
  }

  private async resolveUniqueUsername(email: string): Promise<string> {
    const base = normaliseUsername(email.split('@')[0] ?? 'user')
    let candidate = base
    let suffix = 0
    while (await db.user.findUnique({ where: { username: candidate } })) {
      suffix += 1
      candidate = `${base}${suffix}`
    }
    return candidate
  }
}

function buildDisplayName(workosUser: WorkosUserSnapshot): string {
  const composed = [workosUser.firstName, workosUser.lastName].filter(Boolean).join(' ')
  return composed.length > 0 ? composed : workosUser.email
}

function normaliseUsername(value: string): string {
  return value.replace(/[^a-z0-9_]/gi, '_').slice(0, 32) || 'user'
}

export const userSyncService = new UserSyncService()
