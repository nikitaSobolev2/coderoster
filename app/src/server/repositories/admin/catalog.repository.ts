import 'server-only'
import { db } from '~/server/db'
import { sanitizePlainText } from '~/server/lib/sanitize'
import type { CourseStatus } from '@prisma/client'

export interface AdminCategoryRow {
  id: string
  slug: string
  title: string
  summary: string
  iconKey: string | null
  imageUrl: string | null
  parentCategoryId: string | null
  order: number
  courseCount: number
  updatedAt: Date
}

export interface AdminCategoryUpsertInput {
  slug: string
  title: string
  summary?: string
  iconKey?: string | null
  imageUrl?: string | null
  parentCategoryId?: string | null
  order?: number
}

export interface AdminCourseRow {
  id: string
  slug: string
  title: string
  shortSummary: string
  language: string
  difficulty: string
  status: CourseStatus
  order: number
  tags: string[]
  categoryId: string | null
  authorUsername: string
  publishedAt: Date | null
  updatedAt: Date
  moduleCount: number
  taskCount: number
  enrollmentCount: number
  /** Minimum plan tier to enroll (`Course.tierRequired`). */
  tierRequired: number
  /** Course tasks with `isPremium` across all modules. */
  premiumTaskCount: number
}

export interface AdminCourseListQuery {
  q?: string
  status?: CourseStatus
  categoryId?: string
  cursor?: string
  limit?: number
}

export interface AdminCourseListResult {
  items: AdminCourseRow[]
  nextCursor: string | null
  total: number
}

export class AdminCatalogRepository {
  async listCategories(): Promise<AdminCategoryRow[]> {
    const rows = await db.courseCategory.findMany({
      include: { _count: { select: { courses: true } } },
      orderBy: [{ order: 'asc' }, { title: 'asc' }]
    })
    return rows.map(row => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      iconKey: row.iconKey,
      imageUrl: row.imageUrl,
      parentCategoryId: row.parentCategoryId,
      order: row.order,
      courseCount: row._count.courses,
      updatedAt: row.updatedAt
    }))
  }

  async createCategory(authorId: string, input: AdminCategoryUpsertInput): Promise<string> {
    const created = await db.courseCategory.create({
      data: {
        slug: input.slug,
        title: sanitizePlainText(input.title),
        summary: sanitizePlainText(input.summary ?? ''),
        iconKey: input.iconKey ?? null,
        imageUrl: input.imageUrl ?? null,
        parentCategoryId: input.parentCategoryId ?? null,
        order: input.order ?? 0,
        authorId
      }
    })
    return created.id
  }

  async updateCategory(id: string, input: Partial<AdminCategoryUpsertInput>): Promise<void> {
    await db.courseCategory.update({
      where: { id },
      data: {
        slug: input.slug,
        title: input.title !== undefined ? sanitizePlainText(input.title) : undefined,
        summary: input.summary !== undefined ? sanitizePlainText(input.summary) : undefined,
        iconKey: input.iconKey,
        imageUrl: input.imageUrl,
        parentCategoryId: input.parentCategoryId,
        order: input.order
      }
    })
  }

  async deleteCategory(id: string): Promise<void> {
    await db.courseCategory.delete({ where: { id } })
  }

  async reorderCategories(orderedIds: string[]): Promise<void> {
    await db.$transaction(
      orderedIds.map((categoryId, index) =>
        db.courseCategory.update({ where: { id: categoryId }, data: { order: index } })
      )
    )
  }

  async listCourses(query: AdminCourseListQuery): Promise<AdminCourseListResult> {
    const limit = Math.min(60, Math.max(1, query.limit ?? 30))
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' as const } },
              { slug: { contains: query.q, mode: 'insensitive' as const } }
            ]
          }
        : {})
    }
    const [rows, total] = await Promise.all([
      db.course.findMany({
        where,
        take: limit + 1,
        cursor: query.cursor ? { id: query.cursor } : undefined,
        skip: query.cursor ? 1 : 0,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        include: {
          author: { select: { username: true } },
          modules: { select: { _count: { select: { tasks: true } } } },
          _count: { select: { modules: true, enrollments: true } }
        }
      }),
      db.course.count({ where })
    ])
    const hasMore = rows.length > limit
    const sliced = hasMore ? rows.slice(0, limit) : rows
    const courseIds = sliced.map(row => row.id)
    const modulePremiumRows =
      courseIds.length > 0
        ? await db.courseModule.findMany({
            where: { courseId: { in: courseIds } },
            select: {
              courseId: true,
              _count: {
                select: {
                  tasks: { where: { isPremium: true } }
                }
              }
            }
          })
        : []
    const premiumTaskCountByCourseId = new Map<string, number>()
    for (const m of modulePremiumRows) {
      premiumTaskCountByCourseId.set(
        m.courseId,
        (premiumTaskCountByCourseId.get(m.courseId) ?? 0) + m._count.tasks
      )
    }
    return {
      items: sliced.map(row => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        shortSummary: row.shortSummary,
        language: row.language,
        difficulty: row.difficulty,
        status: row.status,
        order: row.order,
        tags: row.tags,
        categoryId: row.categoryId,
        authorUsername: row.author.username,
        publishedAt: row.publishedAt,
        updatedAt: row.updatedAt,
        moduleCount: row._count.modules,
        taskCount: row.modules.reduce((sum, mod) => sum + mod._count.tasks, 0),
        enrollmentCount: row._count.enrollments,
        tierRequired: row.tierRequired,
        premiumTaskCount: premiumTaskCountByCourseId.get(row.id) ?? 0
      })),
      nextCursor: hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null,
      total
    }
  }

  async createCourse(input: { slug: string; title: string; authorId: string }): Promise<string> {
    const created = await db.course.create({
      data: {
        slug: input.slug,
        title: sanitizePlainText(input.title),
        summary: '',
        shortSummary: '',
        description: '',
        language: 'python',
        difficulty: 'beginner',
        authorId: input.authorId,
        status: 'DRAFT'
      }
    })
    return created.id
  }

  async deleteCourse(id: string): Promise<void> {
    await db.course.delete({ where: { id } })
  }

  async setStatus(id: string, status: CourseStatus): Promise<void> {
    await db.course.update({
      where: { id },
      data: {
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : null
      }
    })
  }

  async reorderCourses(orderedIds: string[]): Promise<void> {
    await db.$transaction(
      orderedIds.map((courseId, index) =>
        db.course.update({ where: { id: courseId }, data: { order: index } })
      )
    )
  }
}
