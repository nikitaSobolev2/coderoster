import { describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: {} }))

import { FakeSearchRepository } from './search.repository'

describe('FakeSearchRepository', () => {
  const repo = new FakeSearchRepository()

  it('global_returns_empty_for_blank_query', async () => {
    const result = await repo.global('   ', { includeAuthRoutes: false })
    expect(result.courses).toEqual([])
    expect(result.users).toEqual([])
    expect(result.appPages).toEqual([])
  })

  it('global_matches_course_by_title_substring', async () => {
    const result = await repo.global('Python', { includeAuthRoutes: false })
    expect(result.courses.length).toBeGreaterThan(0)
  })

  it('global_matches_user_by_username', async () => {
    const result = await repo.global('codenikita', { includeAuthRoutes: false })
    expect(result.users.length).toBe(1)
    expect(result.users[0]?.href).toBe('/u/codenikita')
  })

  it('global_appPages_excludes_auth_routes_when_unauthenticated', async () => {
    const result = await repo.global('sandbox', { includeAuthRoutes: false })
    expect(result.appPages).toEqual([])
  })

  it('global_appPages_includes_auth_routes_when_includeAuthRoutes_true', async () => {
    const result = await repo.global('sandbox', { includeAuthRoutes: true })
    expect(result.appPages.length).toBeGreaterThan(0)
  })
})
