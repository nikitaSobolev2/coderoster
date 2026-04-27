import 'server-only'
import { db } from '~/server/db'
import type { GlobalSearchResults, SearchHit } from './types'
import { getFakeCourseSummaries, getFakeProfile } from './fixtures'

const MAX_PER_GROUP = 5

export interface SearchRepository {
  global(query: string): Promise<GlobalSearchResults>
}

export class FakeSearchRepository implements SearchRepository {
  async global(query: string): Promise<GlobalSearchResults> {
    const term = query.trim().toLowerCase()
    if (!term) return { courses: [], users: [], lessons: [] }
    const courses: SearchHit[] = getFakeCourseSummaries()
      .filter(course => `${course.title} ${course.tags.join(' ')}`.toLowerCase().includes(term))
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
    return { courses, users, lessons: [] }
  }
}

export class PrismaSearchRepository implements SearchRepository {
  async global(query: string): Promise<GlobalSearchResults> {
    const term = query.trim()
    if (!term) return { courses: [], users: [], lessons: [] }

    const [courses, users, lessons] = await Promise.all([
      db.course.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { summary: { contains: term, mode: 'insensitive' } }
          ]
        },
        take: MAX_PER_GROUP,
        select: { id: true, slug: true, title: true, summary: true }
      }),
      db.user.findMany({
        where: {
          OR: [
            { username: { contains: term, mode: 'insensitive' } },
            { displayName: { contains: term, mode: 'insensitive' } }
          ]
        },
        take: MAX_PER_GROUP,
        select: { id: true, username: true, displayName: true }
      }),
      db.courseTask.findMany({
        where: { title: { contains: term, mode: 'insensitive' } },
        take: MAX_PER_GROUP,
        select: {
          id: true,
          title: true,
          module: { select: { course: { select: { slug: true, title: true } } } }
        }
      })
    ])

    return {
      courses: courses.map(course => ({
        kind: 'course',
        id: course.id,
        title: course.title,
        subtitle: course.summary,
        href: `/courses/${course.slug}`
      })),
      users: users.map(user => ({
        kind: 'user',
        id: user.id,
        title: user.displayName,
        subtitle: `@${user.username}`,
        href: `/u/${user.username}`
      })),
      lessons: lessons.map(lesson => ({
        kind: 'lesson',
        id: lesson.id,
        title: lesson.title,
        subtitle: lesson.module.course.title,
        href: `/learn/${lesson.module.course.slug}/${lesson.id}`
      }))
    }
  }
}
