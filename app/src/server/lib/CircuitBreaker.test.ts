import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CircuitBreaker, CircuitBreakerOpenError } from './CircuitBreaker'

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-04-26T12:00:00Z') })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cb_remains_closed_under_threshold', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 3, cooldownMs: 1000 })
    for (let i = 0; i < 5; i++) {
      await expect(cb.run(async () => 1)).resolves.toBe(1)
    }
    expect(cb.isOpen()).toBe(false)
  })

  it('cb_opens_after_threshold_failures', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 3, cooldownMs: 1000 })
    for (let i = 0; i < 3; i++) {
      await expect(cb.run(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom')
    }
    expect(cb.isOpen()).toBe(true)
    await expect(cb.run(async () => 1)).rejects.toBeInstanceOf(CircuitBreakerOpenError)
  })

  it('cb_transitions_half_open_after_cooldown', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 2, cooldownMs: 1000 })
    await expect(cb.run(async () => Promise.reject(new Error('a')))).rejects.toThrow()
    await expect(cb.run(async () => Promise.reject(new Error('b')))).rejects.toThrow()
    expect(cb.isOpen()).toBe(true)
    vi.advanceTimersByTime(1100)
    expect(cb.isOpen()).toBe(false)
  })

  it('cb_resets_to_closed_after_successful_half_open', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 2, cooldownMs: 500 })
    await cb.run(async () => Promise.reject(new Error('a'))).catch(() => undefined)
    await cb.run(async () => Promise.reject(new Error('b'))).catch(() => undefined)
    vi.advanceTimersByTime(600)
    await expect(cb.run(async () => 'ok')).resolves.toBe('ok')
    expect(cb.isOpen()).toBe(false)
  })
})
