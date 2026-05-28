import { faker } from '@faker-js/faker'
import type {
  AuthenticatedUser,
  PublicProfile,
  UserRole,
  UserSettings
} from '~/server/repositories/types'

export function authenticatedUserFactory(
  overrides: Partial<AuthenticatedUser> = {}
): AuthenticatedUser {
  const username = overrides.username ?? faker.internet.username().toLowerCase()
  return {
    id: overrides.id ?? faker.string.uuid(),
    username,
    email: overrides.email ?? faker.internet.email({ provider: 'coderoster.dev' }),
    displayName: overrides.displayName ?? faker.person.fullName(),
    role: overrides.role ?? 'learner',
    bannedUntil: overrides.bannedUntil ?? null,
    banReason: overrides.banReason ?? null,
    chatBannedUntil: overrides.chatBannedUntil ?? null,
    chatBanReason: overrides.chatBanReason ?? null,
    livechatConsentAt: overrides.livechatConsentAt ?? null,
    livechatUsernameColor: overrides.livechatUsernameColor ?? null
  }
}

export function publicProfileFactory(overrides: Partial<PublicProfile> = {}): PublicProfile {
  return {
    id: overrides.id ?? faker.string.uuid(),
    username: overrides.username ?? faker.internet.username().toLowerCase(),
    displayName: overrides.displayName ?? faker.person.fullName(),
    avatarUrl: overrides.avatarUrl ?? null,
    bio: overrides.bio ?? faker.lorem.sentence(),
    joinedAt: overrides.joinedAt ?? faker.date.past({ years: 1 }),
    socials: overrides.socials ?? { github: null, linkedin: null, x: null, website: null },
    stats: overrides.stats ?? {
      totalXp: faker.number.int({ min: 0, max: 5000 }),
      level: faker.number.int({ min: 1, max: 20 }),
      xpIntoLevel: faker.number.int({ min: 0, max: 500 }),
      xpForNextLevel: 600,
      streakDays: faker.number.int({ min: 0, max: 60 }),
      coursesCompleted: faker.number.int({ min: 0, max: 6 }),
      coursesActive: faker.number.int({ min: 0, max: 3 }),
      tasksSolved: faker.number.int({ min: 0, max: 200 })
    },
    isOwner: overrides.isOwner ?? false,
    isStaff: overrides.isStaff ?? false,
    publicPlan: overrides.publicPlan ?? null
  }
}

export function userSettingsFactory(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    displayName: overrides.displayName ?? faker.person.fullName(),
    username: overrides.username ?? faker.internet.username().toLowerCase(),
    email: overrides.email ?? faker.internet.email(),
    bio: overrides.bio ?? faker.lorem.sentence(),
    avatarUrl: overrides.avatarUrl ?? null,
    socials: overrides.socials ?? { github: null, linkedin: null, x: null, website: null },
    appearance: overrides.appearance ?? { colorScheme: 'dark' },
    joinedAt: overrides.joinedAt ?? faker.date.past({ years: 1 }),
    role: overrides.role ?? ('learner' as UserRole),
    allowSelfRoleChange: overrides.allowSelfRoleChange ?? false,
    deletionRequestedAt: overrides.deletionRequestedAt ?? null
  }
}
