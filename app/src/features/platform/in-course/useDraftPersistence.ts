'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import debounce from 'lodash.debounce'
import { useAuth } from '@workos-inc/authkit-nextjs/components'
import { api } from '~/trpc/react'

const LOCAL_PREFIX = 'coderoster.draft.'

/**
 * Bridges the editor with both `localStorage` (instant restore) and the
 * `progress.saveDraft` mutation (server-side persistence), so a learner can
 * close the tab and pick up exactly where they left off.
 *
 * Remote saves use `useAuth().user` (not SSR `isAuthenticated`) so debounced
 * writes never fire before AuthKit client state matches cookies / tRPC context.
 */
export function useDraftPersistence(lessonId: string, starterCode: string) {
  const { user, loading: authLoading } = useAuth()
  const [code, setCode] = useState(() => loadLocalDraft(lessonId) ?? starterCode)
  const saveDraftMutation = api.progress.saveDraft.useMutation()
  const initialised = useRef(false)

  const canPersistRemote = Boolean(!authLoading && user)

  const remoteSave = useMemo(
    () =>
      debounce((value: string) => {
        if (!canPersistRemote) return
        saveDraftMutation.mutate({ lessonId, code: value })
      }, 700),
    [lessonId, canPersistRemote, saveDraftMutation]
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
