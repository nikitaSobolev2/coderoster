import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'
import { resolveDatabaseUrl } from './lib/databaseUrl.js'

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    /**
     * If unset, derived from POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, optional POSTGRES_PORT / POSTGRES_HOST.
     * See `resolveDatabaseUrl` in `./lib/databaseUrl.js`.
     */
    DATABASE_URL: z.string().url(),
    /** Docker Compose / local Postgres; used to build DATABASE_URL when it is not set. */
    POSTGRES_USER: z.string().optional(),
    POSTGRES_PASSWORD: z.string().optional(),
    POSTGRES_DB: z.string().optional(),
    POSTGRES_PORT: z.string().optional(),
    /** Default `localhost` when building DATABASE_URL (host port mapping). */
    POSTGRES_HOST: z.string().optional(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    WORKOS_API_KEY: z.string(),
    WORKOS_CLIENT_ID: z.string(),
    WORKOS_COOKIE_PASSWORD: z.string(),
    /**
     * AuthKit defaults the encrypted session cookie to 10 minutes which is
     * way too aggressive for a learning platform — users are kicked out
     * mid-lesson. Bumped to 30 days; AuthKit silently refreshes the access
     * token via the embedded refresh token until that ceiling is hit.
     */
    WORKOS_COOKIE_MAX_AGE: z.coerce.number().int().positive().default(2_592_000),
    /**
     * When `true`, server repositories return predefined fixtures instead of querying Prisma.
     * Useful for frontend development before the backend is wired up.
     */
    USE_FAKE_DATA: z
      .string()
      .optional()
      .transform(value => value === 'true' || value === '1'),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    RABBITMQ_URL: z.string().default('amqp://guest:guest@localhost:5672'),
    RATE_LIMIT_REDIS_PREFIX: z.string().default('rl:'),
    SANITIZE_MARKDOWN: z
      .string()
      .optional()
      .transform(value => value !== 'false'),
    EXECUTION_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
    EXECUTION_MEMORY_MB: z.coerce.number().int().positive().default(128),
    EXECUTION_CPUS: z.coerce.number().positive().default(0.5),
    EXECUTION_PIDS_LIMIT: z.coerce.number().int().positive().default(64),
    WORKER_PYTHON_IMAGE: z.string().default('python:3.12-slim'),
    WORKER_PHP_IMAGE: z.string().default('php:8.3-cli-alpine'),
    ACTIVITY_SNAPSHOT_CRON: z.string().default('30 0 * * *'),
    /**
     * Email of the user that gets `role = ADMIN` granted automatically on first
     * WorkOS sync (and on `npm run db:seed`). Optional; safe to leave unset
     * after the bootstrap admin has been promoted.
     */
    ADMIN_BOOTSTRAP_EMAIL: z.string().email().optional(),
    /**
     * Object storage (MinIO in dev, S3 / R2 / Spaces in prod).
     * `S3_ENDPOINT` is the internal endpoint the server uses to sign PUT URLs;
     * `S3_PUBLIC_URL` is the host-visible base that browsers will hit. Keep them
     * separate so dev (`http://minio:9000` vs `http://localhost:9000/<bucket>`)
     * works inside docker-compose without rewriting URLs.
     */
    S3_ENDPOINT: z.string().url(),
    S3_PUBLIC_URL: z.string().url(),
    S3_REGION: z.string().default('us-east-1'),
    S3_BUCKET: z.string().default('coderoster-uploads'),
    S3_ACCESS_KEY: z.string(),
    S3_SECRET_KEY: z.string(),
    S3_FORCE_PATH_STYLE: z
      .string()
      .optional()
      .transform(value => value !== 'false')
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: z.string(),
    /**
     * Mirror of `USE_FAKE_DATA` exposed to client components so faker-only UI
     * elements (demo links, fixture-driven banners) can hide themselves.
     */
    NEXT_PUBLIC_USE_FAKE_DATA: z
      .string()
      .optional()
      .transform(value => value === 'true' || value === '1')
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: resolveDatabaseUrl(process.env),
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    NODE_ENV: process.env.NODE_ENV,
    WORKOS_API_KEY: process.env.WORKOS_API_KEY,
    WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID,
    WORKOS_COOKIE_PASSWORD: process.env.WORKOS_COOKIE_PASSWORD,
    WORKOS_COOKIE_MAX_AGE: process.env.WORKOS_COOKIE_MAX_AGE,
    USE_FAKE_DATA: process.env.USE_FAKE_DATA,
    REDIS_URL: process.env.REDIS_URL,
    RABBITMQ_URL: process.env.RABBITMQ_URL,
    RATE_LIMIT_REDIS_PREFIX: process.env.RATE_LIMIT_REDIS_PREFIX,
    SANITIZE_MARKDOWN: process.env.SANITIZE_MARKDOWN,
    EXECUTION_TIMEOUT_MS: process.env.EXECUTION_TIMEOUT_MS,
    EXECUTION_MEMORY_MB: process.env.EXECUTION_MEMORY_MB,
    EXECUTION_CPUS: process.env.EXECUTION_CPUS,
    EXECUTION_PIDS_LIMIT: process.env.EXECUTION_PIDS_LIMIT,
    WORKER_PYTHON_IMAGE: process.env.WORKER_PYTHON_IMAGE,
    WORKER_PHP_IMAGE: process.env.WORKER_PHP_IMAGE,
    ACTIVITY_SNAPSHOT_CRON: process.env.ACTIVITY_SNAPSHOT_CRON,
    ADMIN_BOOTSTRAP_EMAIL: process.env.ADMIN_BOOTSTRAP_EMAIL,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_PUBLIC_URL: process.env.S3_PUBLIC_URL,
    S3_REGION: process.env.S3_REGION,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY,
    S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE,
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
    NEXT_PUBLIC_USE_FAKE_DATA: process.env.NEXT_PUBLIC_USE_FAKE_DATA
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. The `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true
})
