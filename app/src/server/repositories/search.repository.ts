import 'server-only'
import { db } from '~/server/db'
import { sanitizePlainText } from '~/server/lib/sanitize'
import type { GlobalSearchOptions, GlobalSearchResults, SearchHit } from './types'
import { getFakeCourseSummaries, getFakeProfile } from './fixtures'
import { matchStaticRoutes } from './staticRoutes'

const MAX_PER_GROUP = 5
const SUBTITLE_LIMIT = 140

export interface SearchRepository {
  global(query: string, options: GlobalSearchOptions): Promise<GlobalSearchResults>
}

const EMPTY_RESULTS: GlobalSearchResults = {
  courses: [],
  users: [],
  lessons: [],
  pages: [],
  appPages: []
}

export class FakeSearchRepository implements SearchRepository {
  async global(query: string, options: GlobalSearchOptions): Promise<GlobalSearchResults> {
    const term = query.trim().toLowerCase()
    if (!term) return EMPTY_RESULTS
    const courses: SearchHit[] = getFakeCourseSummaries()
      .filter(course =>
        `${course.title} ${course.tags.join(' ')} ${course.slug} ${course.difficulty} ${course.language}`
          .toLowerCase()
          .includes(term)
      )
      .slice(0, MAX_PER_GROUP)
      .map(course => ({
        kind: 'course',
        id: course.id,
        title: course.title,
        subtitle: course.description,
        href: `/courses/${course.slug}`
      }))
    const users: SearchHit[] = []
    const profile = getFakeProfile('codenikita')
    if (profile && (profile.username + ' ' + profile.displayName).toLowerCase().includes(term)) {
      users.push({
        kind: 'user',
        id: profile.id,
        title: profile.displayName,
        subtitle: `@${profile.username}`,
        href: `/u/${profile.username}`
      })
    }
    return {
      courses,
      users,
      lessons: [],
      pages: [],
      appPages: matchStaticRoutes(term, {
        includeAuthRoutes: options.includeAuthRoutes,
        limit: MAX_PER_GROUP
      })
    }
  }
}

/**
 * Substring-based global search. Mirrors `course.list` semantics for the
 * course branch (title / summary / tags / category) so the spotlight and
 * the catalog filters surface the same matches. Substring is enough until
 * the catalog grows past tens of thousands of rows; future hardening would
 * be a `pg_trgm` GIN index, not a code change here.
 */
export class PrismaSearchRepository implements SearchRepository {
  async global(query: string, options: GlobalSearchOptions): Promise<GlobalSearchResults> {
    const term = query.trim()
    if (!term) return EMPTY_RESULTS

    const insensitive = { contains: term, mode: 'insensitive' } as const
    const lowercase = term.toLowerCase()

    const [courses, users, lessons, pages] = await Promise.all([
      db.course.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: insensitive },
            { shortSummary: insensitive },
            { summary: insensitive },
            { description: insensitive },
            { tags: { hasSome: [lowercase] } },
            {
              category: {
                is: { OR: [{ title: insensitive }, { slug: insensitive }] }
              }
            }
          ]
        },
        take: MAX_PER_GROUP,
        select: {
          id: true,
          slug: true,
          title: true,
          shortSummary: true,
          summary: true
        }
      }),
      db.user.findMany({
        where: {
          deletionRequestedAt: null,
          OR: [
            { username: insensitive },
            { displayName: insensitive },
            { firstName: insensitive },
            { lastName: insensitive },
            { email: insensitive }
          ]
        },
        take: MAX_PER_GROUP,
        select: { id: true, username: true, displayName: true }
      }),
      db.courseTask.findMany({
        where: {
          title: insensitive,
          moduleId: { not: null }
        },
        take: MAX_PER_GROUP,
        select: {
          id: true,
          title: true,
          module: { select: { course: { select: { slug: true, title: true } } } }
        }
      }),
      db.contentPage.findMany({
        where: {
          published: true,
          OR: [{ title: insensitive }, { excerpt: insensitive }, { body: insensitive }]
        },
        take: MAX_PER_GROUP,
        select: { id: true, slug: true, title: true, excerpt: true, body: true }
      })
    ])

    return {
      courses: courses.map(course => ({
        kind: 'course' as const,
        id: course.id,
        title: course.title,
        subtitle: course.shortSummary || course.summary,
        href: `/courses/${course.slug}`
      })),
      users: users.map(user => ({
        kind: 'user' as const,
        id: user.id,
        title: user.displayName,
        subtitle: `@${user.username}`,
        href: `/u/${user.username}`
      })),
      lessons: lessons
        .filter(
          (lesson): lesson is typeof lesson & { module: NonNullable<typeof lesson.module> } =>
            lesson.module !== null
        )
        .map(lesson => ({
          kind: 'lesson' as const,
          id: lesson.id,
          title: lesson.title,
          subtitle: lesson.module.course.title,
          href: `/learn/${lesson.module.course.slug}/${lesson.id}`
        })),
      pages: pages.map(page => ({
        kind: 'page' as const,
        id: page.id,
        title: page.title,
        subtitle: buildPageSnippet(page.excerpt, page.body),
        href: `/p/${page.slug}`
      })),
      appPages: matchStaticRoutes(term, {
        includeAuthRoutes: options.includeAuthRoutes,
        limit: MAX_PER_GROUP
      })
    }
  }
}

/**
 * Builds a short, plain-text preview of a content page for the spotlight
 * row. Prefers the explicit excerpt if the author wrote one; otherwise
 * trims the markdown body to a single readable line.
 */
function buildPageSnippet(excerpt: string, body: string): string {
  const explicit = excerpt.trim()
  if (explicit.length > 0) return truncate(sanitizePlainText(explicit))
  return truncate(sanitizePlainText(body.replaceAll(/\s+/g, ' ').trim()))
}

function truncate(value: string): string {
  if (value.length <= SUBTITLE_LIMIT) return value
  return `${value.slice(0, SUBTITLE_LIMIT - 1).trimEnd()}…`
}
