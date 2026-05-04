'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@workos-inc/authkit-nextjs/components'
import { api } from '~/trpc/react'
import type { Language } from '~/server/repositories/types'

const REMOTE_SAVE_DEBOUNCE_MS = 700

function localStorageKey(lessonId: string): string {
  return `coderoster.drafts.byLang.${lessonId}`
}

function readLocalDraftsMap(lessonId: string): Partial<Record<Language, string>> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(localStorageKey(lessonId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const out: Partial<Record<Language, string>> = {}
    for (const lang of ['python', 'php'] as const) {
      const v = (parsed as Record<string, unknown>)[lang]
      if (typeof v === 'string') out[lang] = v
    }
    return Object.keys(out).length > 0 ? out : null
  } catch {
    return null
  }
}

function writeLocalDraftsMap(lessonId: string, drafts: Partial<Record<Language, string>>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(localStorageKey(lessonId), JSON.stringify(drafts))
  } catch {
    /* ignore quota */
  }
}

function clearLocalDrafts(lessonId: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(localStorageKey(lessonId))
  } catch {
    /* ignore */
  }
}

function defaultDraftsFromStarters(
  starterCodes: Partial<Record<Language, string>>,
  allowedLanguages: Language[]
): Partial<Record<Language, string>> {
  const out: Partial<Record<Language, string>> = {}
  for (const lang of allowedLanguages) {
    out[lang] = starterCodes[lang] ?? ''
  }
  return out
}

function localDiffersFromStarters(
  local: Partial<Record<Language, string>> | null,
  starters: Partial<Record<Language, string>>,
  languages: Language[]
): boolean {
  if (!local) return false
  for (const lang of languages) {
    const s = starters[lang] ?? ''
    const l = local[lang]
    if (typeof l === 'string' && l !== s) return true
  }
  return false
}

/**
 * Per-language course task drafts: `localStorage` + debounced `progress.saveDraft` + `getDrafts` hydrate.
 */
export function usePerLanguageDraftPersistence(
  lessonId: string,
  starterCodes: Partial<Record<Language, string>>,
  allowedLanguages: Language[],
  isAuthenticated: boolean
) {
  const starters = useMemo(
    () => defaultDraftsFromStarters(starterCodes, allowedLanguages),
    [starterCodes, allowedLanguages]
  )

  const { user, loading: authLoading } = useAuth()
  const [drafts, setDrafts] = useState<Partial<Record<Language, string>>>(() => {
    const fromLocal = readLocalDraftsMap(lessonId)
    return fromLocal ?? { ...starters }
  })

  const { mutate: saveDraft } = api.progress.saveDraft.useMutation()
  const canPersistRemote = isAuthenticated && !authLoading && Boolean(user)

  const draftsQuery = api.progress.getDrafts.useQuery(
    { lessonId, languages: allowedLanguages },
    { enabled: canPersistRemote, staleTime: 60_000 }
  )

  /* eslint-disable react-hooks/set-state-in-effect -- reset local drafts when lesson starters change */
  useEffect(() => {
    setDrafts(() => {
      const fromLocal = readLocalDraftsMap(lessonId)
      return fromLocal ?? { ...starters }
    })
  }, [lessonId, starters])

  useEffect(() => {
    if (!canPersistRemote || !draftsQuery.isSuccess) return
    const server = draftsQuery.data ?? {}
    const local = readLocalDraftsMap(lessonId)
    if (localDiffersFromStarters(local, starters, allowedLanguages)) return
    setDrafts(prev => {
      const next = { ...prev }
      for (const lang of allowedLanguages) {
        const fromServer = server[lang]
        if (typeof fromServer === 'string' && fromServer.length > 0) {
          next[lang] = fromServer
        }
      }
      return next
    })
  }, [
    canPersistRemote,
    draftsQuery.isSuccess,
    draftsQuery.data,
    lessonId,
    starters,
    allowedLanguages
  ])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    writeLocalDraftsMap(lessonId, drafts)
    if (!canPersistRemote) return
    const handle = setTimeout(() => {
      for (const lang of allowedLanguages) {
        const code = drafts[lang]
        if (typeof code === 'string') {
          saveDraft({ lessonId, language: lang, code })
        }
      }
    }, REMOTE_SAVE_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [drafts, lessonId, canPersistRemote, saveDraft, allowedLanguages])

  const setDraftForLanguage = useCallback((language: Language, code: string) => {
    setDrafts(prev => ({ ...prev, [language]: code }))
  }, [])

  const resetLanguage = useCallback(
    (language: Language) => {
      const s = starters[language] ?? ''
      setDrafts(prev => ({ ...prev, [language]: s }))
    },
    [starters]
  )

  const resetAllLocal = useCallback(() => {
    setDrafts({ ...starters })
    clearLocalDrafts(lessonId)
  }, [lessonId, starters])

  return {
    drafts,
    setDraftForLanguage,
    resetLanguage,
    resetAllLocal
  }
}
