import { prisma } from './client'

/** Mirrors `Role` in `schema.prisma` — string literals avoid `@prisma/client` typings when generate is stale. */
export type SeedRole = 'LEARNER' | 'AUTHOR' | 'MODERATOR' | 'ADMIN'

export const SEED_DOMAIN = 'seed.local'
export const seedEmail = (username: string) => `${username}@${SEED_DOMAIN}`

export interface SeedUser {
  workosUserId: string
  username: string
  displayName: string
  bio?: string
  role?: SeedRole
  socials?: Record<string, string>
}

export async function upsertSeedUser(input: SeedUser) {
  const data = {
    email: seedEmail(input.username),
    displayName: input.displayName,
    bio: input.bio ?? '',
    role: input.role ?? 'LEARNER',
    socials: input.socials ?? {}
  }

  const owner = await prisma.user.findUnique({ where: { username: input.username } })
  if (owner && owner.workosUserId !== input.workosUserId) {
    console.warn(
      `[seed] username "${input.username}" already owned by ${owner.workosUserId} — leaving real user untouched.`
    )
    return owner
  }

  return prisma.user.upsert({
    where: { workosUserId: input.workosUserId },
    update: { username: input.username, ...data },
    create: { workosUserId: input.workosUserId, username: input.username, ...data }
  })
}

export async function upsertAuthor() {
  return upsertSeedUser({
    workosUserId: 'seed-codenikita',
    username: 'codenikita',
    displayName: 'Никита Соболев',
    bio: 'Учусь, ломаю, повторяю. Backend по любви, фронтенд по необходимости.',
    role: 'AUTHOR',
    socials: {
      github: 'https://github.com/nikitaSobolev2',
      website: 'https://t.me/sobolevNikitaWD'
    }
  })
}

export async function upsertSecondaryAuthor() {
  return upsertSeedUser({
    workosUserId: 'seed-php_pro',
    username: 'php_pro',
    displayName: 'Мария Лазарева',
    role: 'AUTHOR'
  })
}

export async function upsertAlgoAuthor() {
  return upsertSeedUser({
    workosUserId: 'seed-algo_dasha',
    username: 'algo_dasha',
    displayName: 'Даша Кравцова',
    role: 'AUTHOR'
  })
}

export async function upsertDemoLearnerNikareich() {
  return upsertSeedUser({
    workosUserId: 'seed-nikareich',
    username: 'nikareich',
    displayName: 'Ника Райх',
    role: 'LEARNER'
  })
}
