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
 * Server-side persistence is gated on **two** independent signals:
 *  1. `isAuthenticated` — provided by the calling page from `withAuth()` so
 *     the server's session truth wins over any client cache lag.
 *  2. `useAuth().user` — AuthKit's client view, which prevents firing while
 *     hydration is still settling on first paint.
 *
 * Without (1) the mutation would be triggered on every keystroke for guest
 * sessions and pile up `UNAUTHORIZED` errors in the network panel.
 *
 * Debounce is implemented as a `setTimeout` inside an effect: the cleanup
 * cancels the pending timer on every dependency change, which is exactly the
 * trailing-edge debounce we want, without needing refs or external libs.
 */
export function useDraftPersistence(
  lessonId: string,
  starterCode: string,
  isAuthenticated: boolean
) {
  const { user, loading: authLoading } = useAuth()
  const [code, setCode] = useState(() => loadLocalDraft(lessonId) ?? starterCode)
  const { mutate: saveDraft } = api.progress.saveDraft.useMutation()
  const canPersistRemote = isAuthenticated && !authLoading && Boolean(user)

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
