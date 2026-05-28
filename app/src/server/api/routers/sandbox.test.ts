import { describe, expect, it } from 'vitest'

import { buildTestCaller } from '~/../tests/setup/trpcCallerFactory'

describe('sandbox router (integration)', () => {
  it('sandbox_listMine_returns_empty_in_fake_mode', async () => {
    const { caller } = buildTestCaller()
    expect(await caller.sandbox.listMine()).toEqual([])
  })

  it('sandbox_save_throws_PRECONDITION_FAILED_in_fake_mode', async () => {
    const { caller } = buildTestCaller()
    await expect(
      caller.sandbox.save({ title: 't', language: 'python', code: 'print(1)' })
    ).rejects.toThrow(/фикстур|PRECONDITION_FAILED/i)
  })

  it('sandbox_remove_returns_ok_in_fake_mode', async () => {
    const { caller } = buildTestCaller()
    const result = await caller.sandbox.remove({ id: 'snip-1' })
    expect(result).toEqual({ ok: true })
  })
})
