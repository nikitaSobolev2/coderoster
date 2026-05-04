import 'server-only'
import type { CourseCategory as PrismaCourseCategory, Prisma } from '@prisma/client'
import { db } from '~/server/db'
import { toCategoryRef, toCourseDetail, toCourseSummary } from './mappers'
import type {
  CategoryNavChildRef,
  CategoryNavParentRef,
  CategoryRef,
  CourseDetail,
  CoursesPage,
  CoursesQuery,
  CourseSummary
} from './types'
import { inferCatalogPremiumTasksBadge } from '~/shared/lib/coursePremiumSignals'
import { findFakeCourseBySlug, getFakeCourseSummaries } from './fixtures'

/** Resolved on the server from the signed-in user; defaults to `0` for guests. */
export interface CourseListContext {
  viewerTier: number
}

export interface CourseRepository {
  list(query: CoursesQuery, context?: CourseListContext): Promise<CoursesPage>
  getBySlug(slug: string): Promise<CourseDetail | null>
  listCategories(): Promise<CategoryRef[]>
  /** Roots + children with ≥1 published course in subtree — header mega-menu. */
  listCategoriesNavTree(): Promise<CategoryNavParentRef[]>
}

export class FakeCourseRepository implements CourseRepository {
  async list(query: CoursesQuery, context?: CourseListContext): Promise<CoursesPage> {
    const all = getFakeCourseSummaries()
    const filtered = all.filter(course => matchesFakeQuery(course, query, context?.viewerTier ?? 0))
    const sorted = applySort(filtered, query.sort)
    return { items: sorted, nextCursor: null, total: sorted.length }
  }

  async getBySlug(slug: string): Promise<CourseDetail | null> {
    return findFakeCourseBySlug(slug)
  }

  async listCategories(): Promise<CategoryRef[]> {
    const seen = new Map<string, CategoryRef>()
    for (const course of getFakeCourseSummaries()) {
      if (course.category && !seen.has(course.category.slug)) {
        seen.set(course.category.slug, course.category)
      }
    }
    return Array.from(seen.values())
  }

  async listCategoriesNavTree(): Promise<CategoryNavParentRef[]> {
    const flat = await this.listCategories()
    return flat.map(c => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      summary: '',
      iconKey: c.iconKey,
      children: [] as CategoryNavChildRef[]
    }))
  }
}

export class PrismaCourseRepository implements CourseRepository {
  async list(query: CoursesQuery, context?: CourseListContext): Promise<CoursesPage> {
    const where = await buildWhere(query, context?.viewerTier ?? 0)
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
          category: true,
          _count: { select: { enrollments: true } }
        }
      }),
      db.course.count({ where })
    ])

    const hasMore = rows.length > limit
    const sliced = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null
    const ids = sliced.map(r => r.id)
    const premiumByCourse = await loadCourseIdsWithPremiumTasks(ids)
    return {
      items: sliced.map(row => ({
        ...toCourseSummary(row),
        hasPremiumTasks: inferCatalogPremiumTasksBadge(
          row.tierRequired,
          premiumByCourse.get(row.id) ?? false
        )
      })),
      nextCursor,
      total
    }
  }

  async getBySlug(slug: string): Promise<CourseDetail | null> {
    const course = await db.course.findUnique({
      where: { slug },
      include: {
        author: true,
        category: true,
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

  async listCategories(): Promise<CategoryRef[]> {
    const rows = await db.courseCategory.findMany({
      where: { courses: { some: { status: 'PUBLISHED' } } },
      orderBy: [{ order: 'asc' }, { title: 'asc' }]
    })
    return rows.map(row => toCategoryRef(row)).filter((ref): ref is CategoryRef => ref !== null)
  }

  async listCategoriesNavTree(): Promise<CategoryNavParentRef[]> {
    const leafRows = await db.course.findMany({
      where: { status: 'PUBLISHED', categoryId: { not: null } },
      select: { categoryId: true }
    })
    const leafIds = [
      ...new Set(leafRows.map(r => r.categoryId).filter((id): id is string => Boolean(id)))
    ]
    if (leafIds.length === 0) return []

    const allCategories = await db.courseCategory.findMany({
      orderBy: [{ order: 'asc' }, { title: 'asc' }]
    })
    const byId = new Map(allCategories.map(row => [row.id, row]))
    const reachable = new Set<string>()

    const addAncestors = (id: string) => {
      let current: PrismaCourseCategory | undefined = byId.get(id)
      while (current) {
        reachable.add(current.id)
        current = current.parentCategoryId ? byId.get(current.parentCategoryId) : undefined
      }
    }
    for (const id of leafIds) addAncestors(id)

    const roots = allCategories.filter(
      row => row.parentCategoryId === null && reachable.has(row.id)
    )

    function toChildRef(row: PrismaCourseCategory): CategoryNavChildRef {
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        iconKey: row.iconKey
      }
    }

    return roots.map(root => ({
      id: root.id,
      slug: root.slug,
      title: root.title,
      summary: root.summary,
      iconKey: root.iconKey,
      children: allCategories
        .filter(row => row.parentCategoryId === root.id && reachable.has(row.id))
        .map(toChildRef)
    }))
  }
}

/**
 * Include each selected slug and every descendant category slug so parent nav
 * (`/courses?category=parent`) matches courses attached to leaf categories.
 */
async function expandCategorySlugsForFilter(slugs: string[]): Promise<string[]> {
  if (slugs.length === 0) return slugs

  const rows = await db.courseCategory.findMany({
    select: { id: true, slug: true, parentCategoryId: true }
  })
  const bySlug = new Map(rows.map(r => [r.slug, r]))
  const byId = new Map(rows.map(r => [r.id, r]))
  const childrenByParentId = new Map<string, typeof rows>()
  for (const r of rows) {
    if (!r.parentCategoryId) continue
    const bucket = childrenByParentId.get(r.parentCategoryId)
    if (bucket) bucket.push(r)
    else childrenByParentId.set(r.parentCategoryId, [r])
  }

  const out = new Set<string>()
  const walk = (id: string) => {
    const row = byId.get(id)
    if (!row) return
    out.add(row.slug)
    for (const c of childrenByParentId.get(id) ?? []) walk(c.id)
  }

  for (const slug of slugs) {
    const row = bySlug.get(slug)
    if (row) walk(row.id)
    else out.add(slug)
  }
  return [...out]
}

async function buildWhere(
  query: CoursesQuery,
  viewerTier: number
): Promise<Prisma.CourseWhereInput> {
  const where: Prisma.CourseWhereInput = { status: 'PUBLISHED' }
  if (query.languages?.length) where.language = { in: query.languages }
  if (query.difficulties?.length) where.difficulty = { in: query.difficulties }
  if (query.categorySlugs?.length) {
    const expanded = await expandCategorySlugsForFilter(query.categorySlugs)
    where.category = { slug: { in: expanded } }
  }
  if (query.durationMin !== undefined || query.durationMax !== undefined) {
    where.durationHours = {
      ...(query.durationMin !== undefined ? { gte: query.durationMin } : {}),
      ...(query.durationMax !== undefined ? { lte: query.durationMax } : {})
    }
  }
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { summary: { contains: query.q, mode: 'insensitive' } },
      { tags: { hasSome: [query.q.toLowerCase()] } }
    ]
  }
  if (query.freeOnly && query.matchesMyPlan) {
    where.tierRequired = 0
  } else if (query.freeOnly) {
    where.tierRequired = 0
  } else if (query.matchesMyPlan) {
    where.tierRequired = { lte: viewerTier }
  }
  return where
}

async function loadCourseIdsWithPremiumTasks(courseIds: string[]): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>(courseIds.map(id => [id, false]))
  if (courseIds.length === 0) return result
  const rows = await db.courseModule.findMany({
    where: { courseId: { in: courseIds } },
    select: {
      courseId: true,
      _count: { select: { tasks: { where: { isPremium: true } } } }
    }
  })
  for (const row of rows) {
    if (row._count.tasks > 0) result.set(row.courseId, true)
  }
  return result
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

function matchesFakeQuery(course: CourseSummary, query: CoursesQuery, viewerTier: number): boolean {
  if (query.languages?.length && !query.languages.includes(course.language)) return false
  if (query.difficulties?.length && !query.difficulties.includes(course.difficulty)) return false
  if (
    query.categorySlugs?.length &&
    (!course.category || !query.categorySlugs.includes(course.category.slug))
  )
    return false
  if (query.durationMin !== undefined && course.durationHours < query.durationMin) return false
  if (query.durationMax !== undefined && course.durationHours > query.durationMax) return false
  if (query.q) {
    const haystack =
      `${course.title} ${course.description} ${course.shortSummary} ${course.tags.join(' ')}`.toLowerCase()
    if (!haystack.includes(query.q.toLowerCase())) return false
  }
  if (query.freeOnly && course.tierRequired !== 0) return false
  if (query.matchesMyPlan && course.tierRequired > viewerTier) return false
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
