import 'server-only'
import type { Prisma } from '@prisma/client'
import { Role } from '@prisma/client'
import { isBootstrapAdminEmail } from '~/server/auth/bootstrapAdminEmail'
import { db } from '~/server/db'
import { sanitizePlainText } from '~/server/lib/sanitize'
import { toUserSettings } from './mappers'
import type { UserRole, UserSettings } from './types'
import { FAKE_USER_SETTINGS } from './fixtures'

export interface SettingsUpdateInput {
  displayName?: string
  username?: string
  bio?: string
  avatarUrl?: string | null
  socials?: Partial<UserSettings['socials']>
  appearance?: Partial<UserSettings['appearance']>
}

export interface SettingsRepository {
  getMine(userId: string): Promise<UserSettings>
  update(userId: string, input: SettingsUpdateInput): Promise<UserSettings>
  /** Bootstrap-email dev helper only; guarded in API layer. */
  updatePlatformRole(userId: string, role: UserRole): Promise<UserSettings>
}

export class FakeSettingsRepository implements SettingsRepository {
  private current: UserSettings = withBootstrapFlag({ ...FAKE_USER_SETTINGS })

  async getMine(_userId: string): Promise<UserSettings> {
    return withBootstrapFlag(this.current)
  }

  async update(_userId: string, input: SettingsUpdateInput): Promise<UserSettings> {
    this.current = withBootstrapFlag({
      ...this.current,
      ...trimDefined(input, ['displayName', 'username', 'bio', 'avatarUrl']),
      socials: { ...this.current.socials, ...(input.socials ?? {}) },
      appearance: { ...this.current.appearance, ...(input.appearance ?? {}) }
    })
    return this.current
  }

  async updatePlatformRole(_userId: string, role: UserRole): Promise<UserSettings> {
    this.current = withBootstrapFlag({ ...this.current, role })
    return this.current
  }
}

export class PrismaSettingsRepository implements SettingsRepository {
  async getMine(userId: string): Promise<UserSettings> {
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } })
    return toUserSettings(user)
  }

  async update(userId: string, input: SettingsUpdateInput): Promise<UserSettings> {
    const data: Prisma.UserUpdateInput = {}
    if (input.displayName !== undefined) data.displayName = sanitizePlainText(input.displayName)
    if (input.username !== undefined) data.username = input.username
    if (input.bio !== undefined) data.bio = sanitizePlainText(input.bio)
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl
    if (input.socials !== undefined) {
      const current = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { socials: true }
      })
      data.socials = mergeJson(current.socials, input.socials)
    }
    if (input.appearance !== undefined) {
      const current = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { appearance: true }
      })
      data.appearance = mergeJson(current.appearance, input.appearance)
    }
    const updated = await db.user.update({ where: { id: userId }, data })
    return toUserSettings(updated)
  }

  async updatePlatformRole(userId: string, role: UserRole): Promise<UserSettings> {
    const updated = await db.user.update({
      where: { id: userId },
      data: { role: domainRoleToPrisma(role) }
    })
    return toUserSettings(updated)
  }
}

function trimDefined<T, K extends keyof T>(input: T, keys: K[]): Partial<T> {
  const out: Partial<T> = {}
  for (const key of keys) {
    if (input[key] !== undefined) out[key] = input[key]
  }
  return out
}

function mergeJson(current: unknown, patch: object): Prisma.InputJsonValue {
  const base = current && typeof current === 'object' ? (current as Record<string, unknown>) : {}
  return { ...base, ...patch } as Prisma.InputJsonValue
}

function withBootstrapFlag(settings: UserSettings): UserSettings {
  return {
    ...settings,
    allowSelfRoleChange: isBootstrapAdminEmail(settings.email)
  }
}

function domainRoleToPrisma(role: UserRole): Role {
  switch (role) {
    case 'author':
      return Role.AUTHOR
    case 'moderator':
      return Role.MODERATOR
    case 'admin':
      return Role.ADMIN
    default:
      return Role.LEARNER
  }
}
