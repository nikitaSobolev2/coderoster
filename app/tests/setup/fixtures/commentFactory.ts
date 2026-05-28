import { faker } from '@faker-js/faker'
import type { ProfileCommentEntry } from '~/server/repositories/types'

export function profileCommentFactory(
  overrides: Partial<ProfileCommentEntry> = {}
): ProfileCommentEntry {
  return {
    id: overrides.id ?? `c-${faker.string.alphanumeric(8)}`,
    authorUsername: overrides.authorUsername ?? faker.internet.username().toLowerCase(),
    authorDisplayName: overrides.authorDisplayName ?? faker.person.fullName(),
    authorAvatarUrl: overrides.authorAvatarUrl ?? null,
    body: overrides.body ?? faker.lorem.sentence(),
    createdAt: overrides.createdAt ?? faker.date.recent({ days: 14 })
  }
}
