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
     * When `true`, server repositories return predefined fixtures instead of querying Prisma.
     * Useful for frontend development before the backend is wired up.
     */
    USE_FAKE_DATA: z
      .string()
      .optional()
      .transform(value => value === 'true' || value === '1')
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: z.string()
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
    USE_FAKE_DATA: process.env.USE_FAKE_DATA,
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
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
