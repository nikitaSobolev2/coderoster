import 'server-only'
import type { Prisma } from '@prisma/client'
import { db } from '~/server/db'
import { sanitizePlainText } from '~/server/lib/sanitize'
import { toUserSettings } from './mappers'
import type { UserSettings } from './types'
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
}

export class FakeSettingsRepository implements SettingsRepository {
  private current: UserSettings = { ...FAKE_USER_SETTINGS }

  async getMine(_userId: string): Promise<UserSettings> {
    return this.current
  }

  async update(_userId: string, input: SettingsUpdateInput): Promise<UserSettings> {
    this.current = {
      ...this.current,
      ...trimDefined(input, ['displayName', 'username', 'bio', 'avatarUrl']),
      socials: { ...this.current.socials, ...(input.socials ?? {}) },
      appearance: { ...this.current.appearance, ...(input.appearance ?? {}) }
    }
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
