'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import debounce from 'lodash.debounce'
import { useAuth } from '@workos-inc/authkit-nextjs/components'
import { api } from '~/trpc/react'

const LOCAL_PREFIX = 'coderoster.draft.'
const REMOTE_SAVE_DEBOUNCE_MS = 700

/**
 * Bridges the editor with both `localStorage` (instant restore) and the
 * `progress.saveDraft` mutation (server-side persistence), so a learner can
 * close the tab and pick up exactly where they left off.
 *
 * Remote saves use `useAuth().user` (not SSR `isAuthenticated`) so debounced
 * writes never fire before AuthKit client state matches cookies / tRPC context.
 *
 * The debounced save is built once per `lessonId` and reads its dependencies
 * (mutation handle, auth flag) through a ref. Rebuilding it on every render
 * would race with batched tRPC requests and surface as spurious client-side
 * abort errors even when the server returned 200.
 */
export function useDraftPersistence(lessonId: string, starterCode: string) {
  const { user, loading: authLoading } = useAuth()
  const [code, setCode] = useState(() => loadLocalDraft(lessonId) ?? starterCode)
  const saveDraftMutation = api.progress.saveDraft.useMutation()
  const canPersistRemote = Boolean(!authLoading && user)

  const saveDraftRef = useRef(saveDraftMutation)
  saveDraftRef.current = saveDraftMutation
  const canPersistRemoteRef = useRef(canPersistRemote)
  canPersistRemoteRef.current = canPersistRemote

  const remoteSave = useMemo(
    () =>
      debounce((value: string) => {
        if (!canPersistRemoteRef.current) return
        saveDraftRef.current.mutate({ lessonId, code: value })
      }, REMOTE_SAVE_DEBOUNCE_MS),
    [lessonId]
  )

  useEffect(() => () => remoteSave.cancel(), [remoteSave])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(LOCAL_PREFIX + lessonId, code)
    remoteSave(code)
  }, [code, lessonId, remoteSave])

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
