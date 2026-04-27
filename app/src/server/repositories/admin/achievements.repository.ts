import 'server-only'
import { db } from '~/server/db'
import { sanitizePlainText } from '~/server/lib/sanitize'

export interface AdminAchievementRow {
  id: string
  slug: string
  title: string
  description: string
  category: string
  rarity: string
  hidden: boolean
  goal: number | null
  /** FontAwesome icon key. Mutually exclusive with `imageUrl` in the UI. */
  coverImage: string | null
  /** Uploaded image URL; takes precedence when set. */
  imageUrl: string | null
  awardId: string | null
  updatedAt: Date
}

export interface AdminAchievementUpsertInput {
  slug: string
  title: string
  description: string
  category: string
  rarity: string
  hidden?: boolean
  goal?: number | null
  coverImage?: string | null
  imageUrl?: string | null
  awardId?: string | null
}

export class AdminAchievementsRepository {
  async list(): Promise<AdminAchievementRow[]> {
    const rows = await db.achievement.findMany({
      orderBy: [{ category: 'asc' }, { title: 'asc' }]
    })
    return rows.map(toRow)
  }

  async get(id: string): Promise<AdminAchievementRow> {
    const row = await db.achievement.findUniqueOrThrow({ where: { id } })
    return toRow(row)
  }

  async create(input: AdminAchievementUpsertInput): Promise<string> {
    const created = await db.achievement.create({
      data: {
        slug: input.slug,
        title: sanitizePlainText(input.title),
        description: sanitizePlainText(input.description),
        category: input.category,
        rarity: input.rarity,
        hidden: input.hidden ?? false,
        goal: input.goal ?? null,
        coverImage: input.coverImage ?? null,
        imageUrl: input.imageUrl ?? null,
        awardId: input.awardId ?? null
      }
    })
    return created.id
  }

  async update(id: string, input: Partial<AdminAchievementUpsertInput>): Promise<void> {
    await db.achievement.update({
      where: { id },
      data: {
        slug: input.slug,
        title: input.title !== undefined ? sanitizePlainText(input.title) : undefined,
        description:
          input.description !== undefined ? sanitizePlainText(input.description) : undefined,
        category: input.category,
        rarity: input.rarity,
        hidden: input.hidden,
        goal: input.goal,
        coverImage: input.coverImage,
        imageUrl: input.imageUrl,
        awardId: input.awardId
      }
    })
  }

  async delete(id: string): Promise<void> {
    await db.achievement.delete({ where: { id } })
  }
}

function toRow(row: {
  id: string
  slug: string
  title: string
  description: string
  category: string
  rarity: string
  hidden: boolean
  goal: number | null
  coverImage: string | null
  imageUrl: string | null
  awardId: string | null
  updatedAt: Date
}): AdminAchievementRow {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    rarity: row.rarity,
    hidden: row.hidden,
    goal: row.goal,
    coverImage: row.coverImage,
    imageUrl: row.imageUrl,
    awardId: row.awardId,
    updatedAt: row.updatedAt
  }
}
