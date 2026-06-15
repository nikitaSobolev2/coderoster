import { faker } from '@faker-js/faker'
import { vi } from 'vitest'

/**
 * Global test setup. Seeds faker for deterministic data, stubs the
 * `server-only` import so server code can be loaded inside Vitest, and
 * disables AuthKit / Prisma side effects that would otherwise hit a real
 * stack.
 */
faker.seed(42)

vi.mock('server-only', () => ({}))

/**
 * Global Prisma stub. Tests can override individual methods via
 * `(db as any).user.findUnique = vi.fn(...)`. The catch-all Proxy emits
 * helpful errors when a test forgets to inject a method.
 */
vi.mock('~/server/db', () => {
  const dbHandler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop) {
      if (typeof prop !== 'string') return Reflect.get(target, prop)
      if (!(prop in target)) {
        target[prop] = new Proxy({} as Record<string, unknown>, {
          get(modelTarget, methodProp) {
            if (typeof methodProp !== 'string') return Reflect.get(modelTarget, methodProp)
            if (!(methodProp in modelTarget)) {
              modelTarget[methodProp] = vi.fn(async () => undefined)
            }
            return modelTarget[methodProp]
          }
        })
      }
      return target[prop]
    }
  }
  const db = new Proxy({} as Record<string, unknown>, dbHandler)
  ;(db as Record<string, unknown>).$transaction = vi.fn(
    async (cb: (tx: unknown) => Promise<unknown>) => cb(db)
  )
  return { db }
})

vi.mock('@workos-inc/authkit-nextjs', () => ({
  withAuth: vi.fn(async () => ({ user: null })),
  signOut: vi.fn(),
  handleAuth: vi.fn()
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(() => false)
  })),
  headers: vi.fn(async () => new Headers())
}))

vi.mock('ioredis', () => {
  class FakeRedis {
    on() {
      return this
    }
    async get() {
      return null
    }
    async set() {
      return 'OK'
    }
    async del() {
      return 0
    }
    async eval() {
      return [1, 60]
    }
    async eval2() {
      return null
    }
    scanStream() {
      const { Readable } = require('node:stream') as typeof import('node:stream')
      return Readable.from([])
    }
    pipeline() {
      return {
        del: () => this,
        exec: async () => []
      }
    }
  }
  return { default: FakeRedis }
})

if (typeof process !== 'undefined') {
  process.env.SKIP_ENV_VALIDATION = process.env.SKIP_ENV_VALIDATION ?? '1'
  // Always fixture mode in Vitest — ignore host `.env` so sandbox/livechat routers
  // and Fake repositories behave consistently in CI and local docker exec.
  process.env.USE_FAKE_DATA = 'true'
  Object.assign(process.env, { NODE_ENV: process.env.NODE_ENV ?? 'test' })
  process.env.RATE_LIMIT_REDIS_PREFIX = process.env.RATE_LIMIT_REDIS_PREFIX ?? 'rl:'
  process.env.WORKOS_API_KEY = process.env.WORKOS_API_KEY ?? 'sk_test_workos'
  process.env.WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID ?? 'client_test'
  process.env.WORKOS_COOKIE_PASSWORD = process.env.WORKOS_COOKIE_PASSWORD ?? 'a'.repeat(48)
  process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI =
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ?? 'http://localhost:3000/callback'
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test'
  process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
  process.env.RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'
  process.env.S3_ENDPOINT = process.env.S3_ENDPOINT ?? 'http://localhost:9000'
  process.env.S3_PUBLIC_URL = process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/coderoster'
  process.env.S3_ACCESS_KEY = process.env.S3_ACCESS_KEY ?? 'minioadmin'
  process.env.S3_SECRET_KEY = process.env.S3_SECRET_KEY ?? 'minioadmin'
}
