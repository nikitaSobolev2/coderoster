#!/usr/bin/env node
/**
 * Copies the locally installed `monaco-editor/min/vs` directory into the
 * Next.js `public/` tree so the editor can be loaded same-origin instead of
 * pulling from a CDN. Runs idempotently before `dev` and `build`.
 *
 * Why: `@monaco-editor/loader` defaults to a jsDelivr CDN. In sandboxed dev
 * environments (Docker, restricted networks) the CDN load fails with an
 * opaque `Monaco initialization: error: {}` and an `[object Event]` rejection.
 * Serving Monaco from `public/monaco-editor/min/vs` removes the dependency.
 */
import { copyFile, mkdir, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const SOURCE = join(PROJECT_ROOT, 'node_modules', 'monaco-editor', 'min')
const TARGET = join(PROJECT_ROOT, 'public', 'monaco-editor', 'min')

async function copyTree(from, to) {
  await mkdir(to, { recursive: true })
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const source = join(from, entry.name)
    const target = join(to, entry.name)
    if (entry.isDirectory()) {
      await copyTree(source, target)
    } else if (entry.isFile()) {
      await copyFile(source, target)
    }
  }
}

async function isUpToDate() {
  if (!existsSync(TARGET)) return false
  const [sourceLoader, targetLoader] = await Promise.all([
    stat(join(SOURCE, 'vs', 'loader.js')),
    stat(join(TARGET, 'vs', 'loader.js')).catch(() => null)
  ])
  return targetLoader !== null && targetLoader.mtimeMs >= sourceLoader.mtimeMs
}

async function main() {
  if (!existsSync(SOURCE)) {
    console.warn(`[copy-monaco] source missing at ${SOURCE}, skipping`)
    return
  }
  if (await isUpToDate()) return
  await copyTree(SOURCE, TARGET)
  console.log(`[copy-monaco] copied → ${TARGET}`)
}

main().catch(error => {
  console.error('[copy-monaco] failed', error)
  process.exit(1)
})
