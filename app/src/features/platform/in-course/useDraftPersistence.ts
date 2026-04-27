'use client'

import { useEffect, useState } from 'react'
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
 * Debounce is implemented as a `setTimeout` inside an effect: the cleanup
 * cancels the pending timer on every dependency change, which is exactly the
 * trailing-edge debounce we want, without needing refs or external libs.
 */
export function useDraftPersistence(lessonId: string, starterCode: string) {
  const { user, loading: authLoading } = useAuth()
  const [code, setCode] = useState(() => loadLocalDraft(lessonId) ?? starterCode)
  const { mutate: saveDraft } = api.progress.saveDraft.useMutation()
  const canPersistRemote = Boolean(!authLoading && user)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCAL_PREFIX + lessonId, code)
    }
    if (!canPersistRemote) return
    const handle = setTimeout(() => {
      saveDraft({ lessonId, code })
    }, REMOTE_SAVE_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [code, lessonId, canPersistRemote, saveDraft])

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
