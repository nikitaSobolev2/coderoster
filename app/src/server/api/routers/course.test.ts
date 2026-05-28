import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/services/PlanService', () => ({
  planService: { getEffectiveTier: vi.fn(async () => 0) }
}))

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'

describe('course router (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('course_list_returns_paginated_summaries', async () => {
    const { caller } = buildTestCaller({ user: null })
    const result = await caller.course.list({})
    expect(result.items.length).toBeGreaterThan(0)
  })

  it('course_list_filters_by_language', async () => {
    const { caller } = buildTestCaller({ user: null })
    const result = await caller.course.list({ languages: ['python'] })
    expect(result.items.every(c => c.language === 'python')).toBe(true)
  })

  it('course_getBySlug_returns_detail', async () => {
    const { caller } = buildTestCaller({ user: null })
    const detail = await caller.course.getBySlug({ slug: 'python-basics' })
    expect(detail?.slug).toBe('python-basics')
  })

  it('course_getBySlug_returns_null_for_unknown', async () => {
    const { caller } = buildTestCaller({ user: null })
    expect(await caller.course.getBySlug({ slug: 'missing' })).toBeNull()
  })

  it('course_listCategories_returns_distinct_list', async () => {
    const { caller } = buildTestCaller({ user: null })
    const categories = await caller.course.listCategories()
    const slugs = categories.map(c => c.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
