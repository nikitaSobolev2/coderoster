'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import debounce from 'lodash.debounce'
import { api } from '~/trpc/react'

const LOCAL_PREFIX = 'coderoster.draft.'

/**
 * Bridges the editor with both `localStorage` (instant restore) and the
 * `progress.saveDraft` mutation (server-side persistence), so a learner can
 * close the tab and pick up exactly where they left off.
 */
export function useDraftPersistence(
  lessonId: string,
  starterCode: string,
  isAuthenticated: boolean
) {
  const [code, setCode] = useState(() => loadLocalDraft(lessonId) ?? starterCode)
  const saveDraftMutation = api.progress.saveDraft.useMutation()
  const initialised = useRef(false)

  const remoteSave = useMemo(
    () =>
      debounce((value: string) => {
        if (!isAuthenticated) return
        saveDraftMutation.mutate({ lessonId, code: value })
      }, 700),
    [lessonId, isAuthenticated, saveDraftMutation]
  )

  useEffect(() => {
    if (initialised.current) return
    initialised.current = true
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(LOCAL_PREFIX + lessonId, code)
    remoteSave(code)
  }, [code, lessonId, remoteSave])

  useEffect(() => () => remoteSave.cancel(), [remoteSave])

  function reset() {
    setCode(starterCode)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCAL_PREFIX + lessonId)
    }
  }

  return { code, setCode, reset }
}

function loadLocalDraft(lessonId: string): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(LOCAL_PREFIX + lessonId)
}
