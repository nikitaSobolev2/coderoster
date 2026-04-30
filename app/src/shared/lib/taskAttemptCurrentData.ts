import type { Language } from '~/server/repositories/types'

export type TaskAttemptCurrentData = {
  code?: string
  drafts?: Partial<Record<string, string>>
}

export function parseAttemptCurrentData(raw: unknown): TaskAttemptCurrentData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const o = raw as Record<string, unknown>
  const drafts: Partial<Record<string, string>> = {}
  if (o.drafts && typeof o.drafts === 'object' && !Array.isArray(o.drafts)) {
    for (const [k, v] of Object.entries(o.drafts as Record<string, unknown>)) {
      if (typeof v === 'string') drafts[k] = v
    }
  }
  const code = typeof o.code === 'string' ? o.code : undefined
  return { code, drafts }
}

export function mergeDraftSave(
  raw: unknown,
  language: Language,
  newCode: string
): TaskAttemptCurrentData {
  const prev = parseAttemptCurrentData(raw)
  return {
    ...prev,
    drafts: { ...prev.drafts, [language]: newCode },
    code: newCode
  }
}

/** Hydrates per-language drafts from DB JSON; missing keys mean "use client starter". */
export function draftsFromAttemptData(
  raw: unknown,
  languages: Language[]
): Partial<Record<Language, string>> {
  const { code, drafts } = parseAttemptCurrentData(raw)
  const out: Partial<Record<Language, string>> = {}
  for (const lang of languages) {
    if (drafts && typeof drafts[lang] === 'string') {
      out[lang] = drafts[lang]
      continue
    }
    if (code !== undefined && languages.length === 1 && languages[0] === lang) {
      out[lang] = code
      continue
    }
    if (code !== undefined && lang === languages[0]) {
      out[lang] = code
    }
  }
  return out
}
