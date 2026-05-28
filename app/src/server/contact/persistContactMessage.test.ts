import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { persistContactMessage } from './persistContactMessage'
import { db } from '~/server/db'

describe('persistContactMessage', () => {
  let createMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createMock = vi.fn(async () => undefined)
    ;(db as unknown as { contactMessage: { create: typeof createMock } }).contactMessage = {
      create: createMock
    }
  })

  it('persist_writes_source_HOME_for_home_source', async () => {
    await persistContactMessage({
      source: 'home',
      name: faker.person.fullName(),
      email: faker.internet.email(),
      message: 'hello'
    })
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: 'HOME' })
      })
    )
  })

  it('persist_writes_source_PLATFORM_for_platform_source', async () => {
    await persistContactMessage({
      source: 'platform',
      name: faker.person.fullName(),
      email: faker.internet.email(),
      message: 'hi'
    })
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: 'PLATFORM' })
      })
    )
  })

  it('persist_sanitizes_message_body_strips_html', async () => {
    await persistContactMessage({
      source: 'home',
      name: 'Nick',
      email: 'a@b.co',
      message: '<script>x</script>clean text'
    })
    const call = createMock.mock.calls[0]?.[0] as { data: { message: string } }
    expect(call.data.message).not.toContain('<script>')
    expect(call.data.message).toContain('clean text')
  })
})
