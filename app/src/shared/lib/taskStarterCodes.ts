import type { Language } from '~/server/repositories/types'

/** Normalize JSON `starterCodes` object keys to canonical `python` / `php`. */
export function normalizeStarterCodeMap(raw: unknown): Partial<Record<Language, string>> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Partial<Record<Language, string>> = {}
  for (const [k, v] of Object.entries(raw)) {
    const lang = String(k).trim().toLowerCase()
    if (lang === 'python' && typeof v === 'string') {
      out.python = v
    } else if (lang === 'php' && typeof v === 'string') {
      out.php = v
    }
  }
  return out
}

/**
 * Per-language template: explicit `starterCodes[lang]` wins; only `primaryLanguage`
 * may fall back to legacy `predefinedCode` so secondary langs never inherit Python-only text.
 */
export function starterCodeForLanguage(input: {
  starterCodes: unknown
  predefinedCode: unknown
  language: Language
  primaryLanguage: Language
}): string {
  const map = normalizeStarterCodeMap(input.starterCodes)
  const specific = map[input.language]
  if (typeof specific === 'string') return specific
  const legacy = typeof input.predefinedCode === 'string' ? input.predefinedCode : ''
  if (input.language === input.primaryLanguage && legacy.length > 0) return legacy
  return ''
}
