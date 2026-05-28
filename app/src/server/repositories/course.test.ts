import { describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db', () => ({ db: {} }))

import { FakeCourseRepository } from './course.repository'

describe('FakeCourseRepository', () => {
  const repo = new FakeCourseRepository()

  it('list_returns_all_when_no_filters', async () => {
    const result = await repo.list({})
    expect(result.items.length).toBeGreaterThan(0)
    expect(result.nextCursor).toBeNull()
  })

  it('list_filters_by_language_python', async () => {
    const result = await repo.list({ languages: ['python'] })
    expect(result.items.every(c => c.language === 'python')).toBe(true)
  })

  it('list_filters_by_difficulty_advanced', async () => {
    const result = await repo.list({ difficulties: ['advanced'] })
    expect(result.items.every(c => c.difficulty === 'advanced')).toBe(true)
  })

  it('list_filters_by_category_slug', async () => {
    const result = await repo.list({ categorySlugs: ['python'] })
    expect(result.items.every(c => c.category?.slug === 'python')).toBe(true)
  })

  it('list_filters_by_duration_range', async () => {
    const result = await repo.list({ durationMin: 12, durationMax: 18 })
    expect(result.items.every(c => c.durationHours >= 12 && c.durationHours <= 18)).toBe(true)
  })

  it('list_freeOnly_excludes_tier_required', async () => {
    const result = await repo.list({ freeOnly: true })
    expect(result.items.every(c => c.tierRequired === 0)).toBe(true)
  })

  it('list_matchesMyPlan_filters_by_viewerTier', async () => {
    const result = await repo.list({ matchesMyPlan: true }, { viewerTier: 0 })
    expect(result.items.every(c => c.tierRequired <= 0)).toBe(true)
  })

  it('list_search_q_matches_title', async () => {
    const result = await repo.list({ q: 'Python' })
    expect(result.items.length).toBeGreaterThan(0)
  })

  it('list_sort_popular_orders_by_enrollment_desc', async () => {
    const result = await repo.list({ sort: 'popular' })
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i - 1]!.enrollmentCount).toBeGreaterThanOrEqual(
        result.items[i]!.enrollmentCount
      )
    }
  })

  it('getBySlug_returns_detail_for_known_slug', async () => {
    const detail = await repo.getBySlug('python-basics')
    expect(detail?.title).toContain('Python')
  })

  it('getBySlug_returns_null_for_unknown', async () => {
    expect(await repo.getBySlug('does-not-exist')).toBeNull()
  })

  it('listCategories_returns_distinct_categories', async () => {
    const categories = await repo.listCategories()
    const slugs = categories.map(c => c.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('listCategoriesNavTree_returns_roots_with_children_array', async () => {
    const tree = await repo.listCategoriesNavTree()
    expect(Array.isArray(tree)).toBe(true)
    expect(tree.every(node => Array.isArray(node.children))).toBe(true)
  })
})
