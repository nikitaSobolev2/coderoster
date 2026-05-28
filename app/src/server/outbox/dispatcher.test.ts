import { describe, expect, it, vi } from 'vitest'

vi.mock('~/server/amqp/publisher', () => ({
  publishEvent: vi.fn(async () => undefined)
}))

import { runOutboxDispatcher } from './dispatcher'

describe('outbox dispatcher (module loads)', () => {
  it('runOutboxDispatcher_is_exported_function', () => {
    expect(typeof runOutboxDispatcher).toBe('function')
  })

  it('runOutboxDispatcher_supports_signal_exit', () => {
    // Module wires SIGTERM/SIGINT signal handlers; ensures import side-effects do not crash.
    expect(process.listenerCount('SIGTERM')).toBeGreaterThan(0)
  })
})
