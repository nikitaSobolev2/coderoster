import { describe, expect, it } from 'vitest'

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'

describe('search router (integration)', () => {
  it('search_global_empty_for_blank_query', async () => {
    const { caller } = buildTestCaller({ user: null })
    const result = await caller.search.global({ q: '' })
    expect(result.courses).toEqual([])
  })

  it('search_global_returns_courses_for_known_term', async () => {
    const { caller } = buildTestCaller({ user: null })
    const result = await caller.search.global({ q: 'Python' })
    expect(result.courses.length).toBeGreaterThan(0)
  })

  it('search_global_includeAuthRoutes_true_for_authenticated', async () => {
    const { caller } = buildTestCaller()
    const result = await caller.search.global({ q: 'sandbox' })
    expect(result.appPages.length).toBeGreaterThan(0)
  })

  it('search_global_includeAuthRoutes_false_for_anonymous', async () => {
    const { caller } = buildTestCaller({ user: null })
    const result = await caller.search.global({ q: 'sandbox' })
    expect(result.appPages).toEqual([])
  })
})
