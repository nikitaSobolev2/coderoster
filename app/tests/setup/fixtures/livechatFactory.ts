import { faker } from '@faker-js/faker'
import type { LivechatMessageDTO } from '~/server/livechat/livechat.repository'

export function livechatMessageFactory(
  overrides: Partial<LivechatMessageDTO> = {}
): LivechatMessageDTO {
  const authorKind = overrides.authorKind ?? 'AUTH'
  return {
    id: overrides.id ?? `lc-${faker.string.alphanumeric(10)}`,
    createdAt: overrides.createdAt ?? faker.date.recent({ days: 1 }),
    body: overrides.body ?? faker.lorem.sentence(),
    authorKind,
    authorLabel: overrides.authorLabel ?? faker.internet.username(),
    usernameColor: overrides.usernameColor ?? 'blue',
    authorProfileUsername:
      overrides.authorProfileUsername ?? (authorKind === 'AUTH' ? faker.internet.username() : null),
    authorIsStaff: overrides.authorIsStaff ?? false,
    authorPlanTierLevel: overrides.authorPlanTierLevel ?? 0,
    authorPlanBadge: overrides.authorPlanBadge ?? null
  }
}
