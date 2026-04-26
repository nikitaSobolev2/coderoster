import type { CourseDetail, CoursesPage, CoursesQuery } from './types'
import { findFakeCourseBySlug, getFakeCourseSummaries } from './fixtures'
import { stubNotImplemented } from './stub'

/**
 * Read access for the course catalog. Implementations either query Prisma or return fixtures.
 */
export interface CourseRepository {
  list(query: CoursesQuery): Promise<CoursesPage>
  getBySlug(slug: string): Promise<CourseDetail | null>
}

export class FakeCourseRepository implements CourseRepository {
  async list(query: CoursesQuery): Promise<CoursesPage> {
    const all = getFakeCourseSummaries()
    const filtered = all.filter(course => matchesQuery(course, query))
    const sorted = applySort(filtered, query.sort)
    return { items: sorted, nextCursor: null, total: sorted.length }
  }

  async getBySlug(slug: string): Promise<CourseDetail | null> {
    return findFakeCourseBySlug(slug)
  }
}

export class PrismaCourseRepository implements CourseRepository {
  list(): Promise<CoursesPage> {
    return stubNotImplemented('CourseRepository.list')
  }

  getBySlug(): Promise<CourseDetail | null> {
    return stubNotImplemented('CourseRepository.getBySlug')
  }
}

function matchesQuery(
  course: ReturnType<typeof getFakeCourseSummaries>[number],
  query: CoursesQuery
): boolean {
  if (query.language && course.language !== query.language) return false
  if (query.difficulty && course.difficulty !== query.difficulty) return false
  if (query.q) {
    const haystack = `${course.title} ${course.description} ${course.tags.join(' ')}`.toLowerCase()
    if (!haystack.includes(query.q.toLowerCase())) return false
  }
  return true
}

function applySort(
  courses: ReturnType<typeof getFakeCourseSummaries>,
  sort: CoursesQuery['sort']
): ReturnType<typeof getFakeCourseSummaries> {
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
