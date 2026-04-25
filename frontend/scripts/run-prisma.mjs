/**
 * Ensures DATABASE_URL is set (from POSTGRES_* if needed) so Prisma CLI matches Next `src/env.js`.
 * Usage: node scripts/run-prisma.mjs <prisma subcommand> [...]
 * Example: node scripts/run-prisma.mjs generate
 */
import { config } from 'dotenv'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveDatabaseUrl } from '../src/lib/databaseUrl.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
// Match Next load order: base then local overrides (same as cp .env .env.local workflow).
config({ path: join(root, '.env') })
config({ path: join(root, '.env.local'), override: true })

const url = resolveDatabaseUrl(process.env)
if (!url) {
  console.error(
    'Missing DATABASE_URL. Set it, or set POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB (and optional POSTGRES_PORT, POSTGRES_HOST) to match docker-compose.\n' +
      'See .env.example.'
  )
  process.exit(1)
}
const childEnv = { ...process.env, DATABASE_URL: url }
const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: node scripts/run-prisma.mjs <prisma subcommand> [...]')
  process.exit(1)
}
const result = spawnSync('npx', ['prisma', ...args], {
  stdio: 'inherit',
  env: childEnv,
  shell: true,
  cwd: root
})
process.exit(result.status ?? 1)
