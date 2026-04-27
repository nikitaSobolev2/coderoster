/**
 * Builds a Prisma/Postgres connection URL for local dev when the app and Docker
 * both read the same POSTGRES_* variables. DATABASE_URL, when set, always wins.
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {string | undefined}
 */
export function resolveDatabaseUrl(env) {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL
  }
  const user = env.POSTGRES_USER
  const pass = env.POSTGRES_PASSWORD
  const db = env.POSTGRES_DB
  if (!user || !pass || !db) {
    return undefined
  }
  const port = env.POSTGRES_PORT || '5432'
  // Host: app on the host OS connecting to the published port (see docker-compose ports).
  const host = env.POSTGRES_HOST || 'localhost'
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}`
}
