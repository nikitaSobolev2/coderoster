import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'

import { FakeAdminCatalogRepository } from '~/../tests/setup/repositories/fakeAdmin'

describe('FakeAdminCatalogRepository', () => {
  let repo: FakeAdminCatalogRepository

  beforeEach(() => {
    repo = new FakeAdminCatalogRepository()
  })

  it('listCourses_paginates', async () => {
    for (let i = 0; i < 5; i++) repo.seedCourse()
    const page = await repo.listCourses({ limit: 2 })
    expect(page.items).toHaveLength(2)
    expect(page.total).toBe(5)
  })

  it('createCourse_persists_authorId_and_slug', async () => {
    const authorId = faker.string.uuid()
    const created = await repo.createCourse({ slug: 'php', title: 'PHP', authorId })
    expect(created.authorId).toBe(authorId)
    expect(created.slug).toBe('php')
  })

  it('setStatus_changes_to_PUBLISHED', async () => {
    const course = repo.seedCourse({ status: 'DRAFT' })
    await repo.setStatus(course.id, 'PUBLISHED')
    const result = await repo.listCourses({})
    expect(result.items[0]?.status).toBe('PUBLISHED')
  })

  it('reorderCourses_updates_order', async () => {
    const a = repo.seedCourse()
    const b = repo.seedCourse()
    await repo.reorderCourses([b.id, a.id])
    const result = await repo.listCourses({})
    const orderById = new Map(result.items.map(c => [c.id, c.order]))
    expect(orderById.get(b.id)).toBe(0)
    expect(orderById.get(a.id)).toBe(1)
  })

  it('categories_create_root_and_child', async () => {
    const root = await repo.createCategory({ slug: 'root', title: 'Root' })
    const child = await repo.createCategory({
      slug: 'child',
      title: 'Child',
      parentCategoryId: root.id
    })
    const categories = await repo.listCategories()
    expect(categories.find(c => c.id === child.id)?.parentCategoryId).toBe(root.id)
  })

  it('setStatus_throws_for_unknown_course', async () => {
    await expect(repo.setStatus('unknown', 'PUBLISHED')).rejects.toThrow('COURSE_NOT_FOUND')
  })
})
