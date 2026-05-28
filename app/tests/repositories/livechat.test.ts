import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'

import { FakeLivechatRepository } from '~/../tests/setup/repositories/fakeAdmin'

describe('FakeLivechatRepository', () => {
  let repo: FakeLivechatRepository

  beforeEach(() => {
    repo = new FakeLivechatRepository()
  })

  it('insertAuthMessage_persists_user_link', async () => {
    const message = await repo.insertAuthMessage({
      userId: 'u1',
      body: 'hello',
      authorLabel: 'nick',
      usernameColor: 'blue'
    })
    expect(message.authorKind).toBe('AUTH')
    expect(message.authorProfileUsername).toBe('nick')
  })

  it('insertGuestMessage_persists_guest_session', async () => {
    const message = await repo.insertGuestMessage({
      guestSessionId: faker.string.uuid(),
      body: 'hi from guest',
      guestLabel: 'Guest42',
      usernameColor: 'green'
    })
    expect(message.authorKind).toBe('GUEST')
    expect(message.authorProfileUsername).toBeNull()
  })

  it('listRecent_returns_chronological_with_default_50_limit', async () => {
    for (let i = 0; i < 3; i++) repo.seed()
    const { items } = await repo.listRecent()
    expect(items).toHaveLength(3)
    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1]!.createdAt.getTime()).toBeLessThanOrEqual(items[i]!.createdAt.getTime())
    }
  })

  it('listOlderThan_returns_empty_when_anchor_unknown', async () => {
    const result = await repo.listOlderThan('unknown', 5)
    expect(result.items).toHaveLength(0)
    expect(result.nextCursorOlder).toBeNull()
  })

  it('setUserUsernameColor_rejects_disallowed_color', async () => {
    await expect(repo.setUserUsernameColor('u1', 'magenta')).rejects.toThrow(
      'USERNAME_COLOR_NOT_ALLOWED'
    )
  })

  it('setUserUsernameColor_accepts_allowed_color', async () => {
    await expect(repo.setUserUsernameColor('u1', 'blue')).resolves.toBeUndefined()
  })

  it('guestHasConsent_false_until_recordGuestConsent', async () => {
    const session = faker.string.uuid()
    expect(await repo.guestHasConsent(session)).toBe(false)
    await repo.recordGuestConsent(session)
    expect(await repo.guestHasConsent(session)).toBe(true)
  })

  it('acceptUserConsent_records_user', async () => {
    await repo.acceptUserConsent('u1')
    expect(repo.hasUserConsent('u1')).toBe(true)
  })
})
