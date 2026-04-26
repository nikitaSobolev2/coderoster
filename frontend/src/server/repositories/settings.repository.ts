import type { UserSettings } from './types'
import { FAKE_USER_SETTINGS } from './fixtures'
import { stubNotImplemented } from './stub'

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
      ...trim(input, ['displayName', 'username', 'bio', 'avatarUrl']),
      socials: { ...this.current.socials, ...(input.socials ?? {}) },
      appearance: { ...this.current.appearance, ...(input.appearance ?? {}) }
    }
    return this.current
  }
}

export class PrismaSettingsRepository implements SettingsRepository {
  getMine(): Promise<UserSettings> {
    return stubNotImplemented('SettingsRepository.getMine')
  }

  update(): Promise<UserSettings> {
    return stubNotImplemented('SettingsRepository.update')
  }
}

function trim<T, K extends keyof T>(input: T, keys: K[]): Partial<T> {
  const out: Partial<T> = {}
  for (const key of keys) {
    if (input[key] !== undefined) out[key] = input[key]
  }
  return out
}
