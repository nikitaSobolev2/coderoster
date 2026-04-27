import 'server-only'
import { ContentPagePlacement } from '@prisma/client'
import { db } from '~/server/db'
import { sanitizeMarkdown, sanitizePlainText } from '~/server/lib/sanitize'

export interface AdminContentPageRow {
  id: string
  slug: string
  title: string
  excerpt: string
  placement: ContentPagePlacement
  groupKey: string
  order: number
  published: boolean
  updatedAt: Date
}

export interface AdminContentPageDetail extends AdminContentPageRow {
  body: string
}

export interface AdminContentPageUpsertInput {
  slug: string
  title: string
  body: string
  excerpt?: string
  placement?: ContentPagePlacement
  groupKey?: string
  order?: number
  published?: boolean
}

export class AdminContentPagesRepository {
  async list(): Promise<AdminContentPageRow[]> {
    const rows = await db.contentPage.findMany({
      orderBy: [{ placement: 'asc' }, { groupKey: 'asc' }, { order: 'asc' }]
    })
    return rows.map(toRow)
  }

  async get(id: string): Promise<AdminContentPageDetail> {
    const row = await db.contentPage.findUniqueOrThrow({ where: { id } })
    return { ...toRow(row), body: row.body }
  }

  async create(input: AdminContentPageUpsertInput): Promise<string> {
    const created = await db.contentPage.create({
      data: {
        slug: input.slug,
        title: sanitizePlainText(input.title),
        body: sanitizeMarkdown(input.body),
        excerpt: sanitizePlainText(input.excerpt ?? ''),
        placement: input.placement ?? ContentPagePlacement.FOOTER,
        groupKey: sanitizePlainText(input.groupKey ?? 'about'),
        order: input.order ?? 0,
        published: input.published ?? false
      }
    })
    return created.id
  }

  async update(id: string, input: Partial<AdminContentPageUpsertInput>): Promise<void> {
    await db.contentPage.update({
      where: { id },
      data: {
        slug: input.slug,
        title: input.title !== undefined ? sanitizePlainText(input.title) : undefined,
        body: input.body !== undefined ? sanitizeMarkdown(input.body) : undefined,
        excerpt: input.excerpt !== undefined ? sanitizePlainText(input.excerpt) : undefined,
        placement: input.placement,
        groupKey: input.groupKey !== undefined ? sanitizePlainText(input.groupKey) : undefined,
        order: input.order,
        published: input.published
      }
    })
  }

  async delete(id: string): Promise<void> {
    await db.contentPage.delete({ where: { id } })
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await db.$transaction(
      orderedIds.map((pageId, index) =>
        db.contentPage.update({ where: { id: pageId }, data: { order: index } })
      )
    )
  }

  async listPublishedFooter(): Promise<AdminContentPageRow[]> {
    const rows = await db.contentPage.findMany({
      where: { placement: ContentPagePlacement.FOOTER, published: true },
      orderBy: [{ groupKey: 'asc' }, { order: 'asc' }]
    })
    return rows.map(toRow)
  }

  async getPublishedBySlug(slug: string): Promise<AdminContentPageDetail | null> {
    const row = await db.contentPage.findFirst({ where: { slug, published: true } })
    if (!row) return null
    return { ...toRow(row), body: row.body }
  }
}

function toRow(row: {
  id: string
  slug: string
  title: string
  excerpt: string
  placement: ContentPagePlacement
  groupKey: string
  order: number
  published: boolean
  updatedAt: Date
}): AdminContentPageRow {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    placement: row.placement,
    groupKey: row.groupKey,
    order: row.order,
    published: row.published,
    updatedAt: row.updatedAt
  }
}
