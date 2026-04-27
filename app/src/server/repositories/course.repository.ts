import 'server-only'
import type { Prisma } from '@prisma/client'
import { db } from '~/server/db'
import { toCourseDetail, toCourseSummary } from './mappers'
import type { CourseDetail, CoursesPage, CoursesQuery, CourseSummary } from './types'
import { findFakeCourseBySlug, getFakeCourseSummaries } from './fixtures'

export interface CourseRepository {
  list(query: CoursesQuery): Promise<CoursesPage>
  getBySlug(slug: string): Promise<CourseDetail | null>
}

export class FakeCourseRepository implements CourseRepository {
  async list(query: CoursesQuery): Promise<CoursesPage> {
    const all = getFakeCourseSummaries()
    const filtered = all.filter(course => matchesFakeQuery(course, query))
    const sorted = applySort(filtered, query.sort)
    return { items: sorted, nextCursor: null, total: sorted.length }
  }

  async getBySlug(slug: string): Promise<CourseDetail | null> {
    return findFakeCourseBySlug(slug)
  }
}

export class PrismaCourseRepository implements CourseRepository {
  async list(query: CoursesQuery): Promise<CoursesPage> {
    const where = buildWhere(query)
    const orderBy = buildOrderBy(query.sort)
    const limit = Math.min(60, Math.max(1, query.limit ?? 24))

    const [rows, total] = await Promise.all([
      db.course.findMany({
        where,
        take: limit + 1,
        cursor: query.cursor ? { id: query.cursor } : undefined,
        skip: query.cursor ? 1 : 0,
        orderBy,
        include: {
          author: true,
          _count: { select: { enrollments: true } }
        }
      }),
      db.course.count({ where })
    ])

    const hasMore = rows.length > limit
    const sliced = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null
    return {
      items: sliced.map(toCourseSummary),
      nextCursor,
      total
    }
  }

  async getBySlug(slug: string): Promise<CourseDetail | null> {
    const course = await db.course.findUnique({
      where: { slug },
      include: {
        author: true,
        modules: {
          include: { tasks: true },
          orderBy: { order: 'asc' }
        },
        _count: { select: { enrollments: true } }
      }
    })
    if (!course) return null
    return toCourseDetail(course)
  }
}

function buildWhere(query: CoursesQuery): Prisma.CourseWhereInput {
  const where: Prisma.CourseWhereInput = { status: 'PUBLISHED' }
  if (query.language) where.language = query.language
  if (query.difficulty) where.difficulty = query.difficulty
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { summary: { contains: query.q, mode: 'insensitive' } },
      { tags: { hasSome: [query.q.toLowerCase()] } }
    ]
  }
  return where
}

function buildOrderBy(sort: CoursesQuery['sort']): Prisma.CourseOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest':
      return [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
    case 'shortest':
      return [{ durationHours: 'asc' }, { createdAt: 'desc' }]
    case 'popular':
    default:
      return [{ enrollments: { _count: 'desc' } }, { createdAt: 'desc' }]
  }
}

function matchesFakeQuery(course: CourseSummary, query: CoursesQuery): boolean {
  if (query.language && course.language !== query.language) return false
  if (query.difficulty && course.difficulty !== query.difficulty) return false
  if (query.q) {
    const haystack = `${course.title} ${course.description} ${course.tags.join(' ')}`.toLowerCase()
    if (!haystack.includes(query.q.toLowerCase())) return false
  }
  return true
}

function applySort(courses: CourseSummary[], sort: CoursesQuery['sort']): CourseSummary[] {
  const copy = [...courses]
  switch (sort) {
    case 'newest':
      return copy.reverse()
    case 'shortest':
      return copy.sort((a, b) => a.durationHours - b.durationHours)
    case 'popular':
    default:
      return copy.sort((a, b) => b.enrollmentCount - a.enrollmentCount)
  }
}
