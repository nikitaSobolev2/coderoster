import { vi } from 'vitest'

/**
 * Builds a recursive Prisma-shaped Proxy that records every chain and returns
 * `vi.fn()` for every leaf. Tests overwrite specific methods via
 * `db.user.findUnique = vi.fn(async () => ...)`.
 */
export function buildDbMock<T extends object = Record<string, unknown>>(): T {
  const cache = new Map<string, unknown>()
  const build = (path: string[]): unknown =>
    new Proxy(vi.fn(), {
      get(target, prop: string) {
        if (prop === 'then') return undefined
        if (typeof prop === 'symbol') return Reflect.get(target, prop)
        const key = [...path, prop].join('.')
        if (!cache.has(key)) cache.set(key, build([...path, prop]))
        return cache.get(key)
      },
      apply(target) {
        return target()
      }
    })

  return build([]) as T
}

export function makeTx(): { tx: Record<string, unknown>; reset: () => void } {
  const tx = buildDbMock<Record<string, unknown>>()
  return {
    tx,
    reset: () => {
      Object.keys(tx).forEach(k => delete (tx as Record<string, unknown>)[k])
    }
  }
}
