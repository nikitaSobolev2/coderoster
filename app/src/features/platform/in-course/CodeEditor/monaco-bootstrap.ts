'use client'

import loader from '@monaco-editor/loader'

/**
 * `@monaco-editor/react` ships a loader that fetches Monaco from jsDelivr by
 * default. In sandboxed dev environments the CDN load fails with an opaque
 * `Monaco initialization: error: {}` and an `[object Event]` unhandled
 * rejection.
 *
 * We serve Monaco from `public/monaco-editor/min/vs` (populated by
 * `scripts/copy-monaco.mjs`) so the editor loads same-origin and works
 * offline. Loader touches `window`, so configuration is browser-only.
 */
const MONACO_VS_PATH = '/monaco-editor/min/vs'

let isConfigured = false

export function ensureMonacoLoaderConfigured(): void {
  if (isConfigured) return
  if (typeof window === 'undefined') return
  isConfigured = true

  loader.config({ paths: { vs: MONACO_VS_PATH } })
}
