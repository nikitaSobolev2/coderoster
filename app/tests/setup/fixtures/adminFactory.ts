import { faker } from '@faker-js/faker'

/**
 * Generic shapes for admin domains; matches the repository inputs without
 * pulling Prisma types so we avoid a circular dependency on the generated
 * client during unit tests.
 */

export interface AuditEntry {
  id: string
  actorId: string
  action: string
  targetType: string
  targetId: string
  createdAt: Date
  diff: unknown
}

export function auditEntryFactory(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id: overrides.id ?? faker.string.uuid(),
    actorId: overrides.actorId ?? faker.string.uuid(),
    action: overrides.action ?? `admin.${faker.lorem.word()}.${faker.lorem.word()}`,
    targetType: overrides.targetType ?? 'user',
    targetId: overrides.targetId ?? faker.string.uuid(),
    createdAt: overrides.createdAt ?? faker.date.recent({ days: 14 }),
    diff: overrides.diff ?? null
  }
}

export interface ContentPage {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  published: boolean
  placement: 'FOOTER' | 'NONE'
}

export function contentPageFactory(overrides: Partial<ContentPage> = {}): ContentPage {
  return {
    id: overrides.id ?? faker.string.uuid(),
    slug: overrides.slug ?? faker.helpers.slugify(faker.lorem.words(2)).toLowerCase(),
    title: overrides.title ?? faker.lorem.words(3),
    excerpt: overrides.excerpt ?? faker.lorem.sentence(),
    body: overrides.body ?? faker.lorem.paragraphs(3),
    published: overrides.published ?? true,
    placement: overrides.placement ?? 'NONE'
  }
}

export interface ContactMessage {
  id: string
  source: 'HOME' | 'PLATFORM'
  name: string
  email: string
  message: string
  createdAt: Date
}

export function contactMessageFactory(overrides: Partial<ContactMessage> = {}): ContactMessage {
  return {
    id: overrides.id ?? faker.string.uuid(),
    source: overrides.source ?? faker.helpers.arrayElement(['HOME', 'PLATFORM']),
    name: overrides.name ?? faker.person.fullName(),
    email: overrides.email ?? faker.internet.email(),
    message: overrides.message ?? faker.lorem.paragraph(),
    createdAt: overrides.createdAt ?? faker.date.recent({ days: 30 })
  }
}
