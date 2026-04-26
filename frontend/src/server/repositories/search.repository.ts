import type { GlobalSearchResults, SearchHit } from './types'
import { getFakeCourseSummaries, getFakeProfile } from './fixtures'
import { stubNotImplemented } from './stub'

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
  global(): Promise<GlobalSearchResults> {
    return stubNotImplemented('SearchRepository.global')
  }
}
