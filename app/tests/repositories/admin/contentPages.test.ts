import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'

import { FakeAdminContentPagesRepository } from '~/../tests/setup/repositories/fakeAdmin'

describe('FakeAdminContentPagesRepository', () => {
  let repo: FakeAdminContentPagesRepository

  beforeEach(() => {
    repo = new FakeAdminContentPagesRepository()
  })

  it('list_returns_paginated_pages', async () => {
    for (let i = 0; i < 4; i++) repo.seed()
    const result = await repo.list({ limit: 2 })
    expect(result.items).toHaveLength(2)
    expect(result.total).toBe(4)
  })

  it('create_persists_markdown_and_excerpt', async () => {
    const body = faker.lorem.paragraphs(3)
    const created = await repo.create({
      slug: 'about',
      title: 'About',
      excerpt: 'short',
      body,
      published: true,
      placement: 'FOOTER'
    })
    expect(created.body).toBe(body)
  })

  it('update_changes_published_flag', async () => {
    const page = repo.seed({ published: true })
    const updated = await repo.update(page.id, { published: false })
    expect(updated.published).toBe(false)
  })

  it('placement_FOOTER_filters_for_platform_footer', async () => {
    repo.seed({ placement: 'FOOTER' })
    repo.seed({ placement: 'NONE' })
    const footer = await repo.list({ placement: 'FOOTER' })
    expect(footer.items.every(p => p.placement === 'FOOTER')).toBe(true)
  })
})
