import 'server-only'
import type { User } from '@prisma/client'
import { db } from '~/server/db'
import { redis } from '~/server/redis'
import { sanitizePlainText } from '~/server/lib/sanitize'

export interface WorkosUserSnapshot {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  profilePictureUrl: string | null
}

const CACHE_TTL_SECONDS = 600
const CACHE_PREFIX = 'user:byWorkos:'

/**
 * Resolves a WorkOS-authenticated session to the local `User` row, creating it
 * on first sight. The cache is keyed by `workosUserId` so subsequent requests
 * skip the database round-trip entirely.
 */
export class UserSyncService {
  async syncFromSession(workosUser: WorkosUserSnapshot): Promise<User> {
    const cached = await this.readCached(workosUser.id)
    if (cached) return cached

    const existing = await db.user.findUnique({ where: { workosUserId: workosUser.id } })
    const user = existing ?? (await this.createNew(workosUser))
    await this.writeCached(user)
    return user
  }

  async invalidate(workosUserId: string): Promise<void> {
    await redis.del(`${CACHE_PREFIX}${workosUserId}`)
  }

  private async readCached(workosUserId: string): Promise<User | null> {
    const raw = await redis.get(`${CACHE_PREFIX}${workosUserId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return reviveUserDates(parsed)
  }

  private async writeCached(user: User): Promise<void> {
    await redis.set(
      `${CACHE_PREFIX}${user.workosUserId}`,
      JSON.stringify(user),
      'EX',
      CACHE_TTL_SECONDS
    )
  }

  private async createNew(workosUser: WorkosUserSnapshot): Promise<User> {
    const username = await this.resolveUniqueUsername(workosUser.email)
    const displayName = sanitizePlainText(buildDisplayName(workosUser))
    return db.user.create({
      data: {
        workosUserId: workosUser.id,
        email: workosUser.email,
        username,
        displayName,
        firstName: workosUser.firstName,
        lastName: workosUser.lastName,
        avatarUrl: workosUser.profilePictureUrl
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

function reviveUserDates(parsed: Record<string, unknown>): User {
  const dates: (keyof User)[] = ['joinedAt', 'updatedAt']
  for (const key of dates) {
    const value = parsed[key]
    if (typeof value === 'string') {
      parsed[key] = new Date(value)
    }
  }
  return parsed as unknown as User
}

export const userSyncService = new UserSyncService()
