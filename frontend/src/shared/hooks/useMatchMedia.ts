'use client'

import { useMemo, useSyncExternalStore } from 'react'

const getServerSnapshot = () => false

const noop = () => {
  return
}

function createSubscribe(query: string) {
  return (notify: () => void) => {
    if (typeof window === 'undefined') return noop
    const mql = window.matchMedia(query)
    mql.addEventListener('change', notify)
    return () => mql.removeEventListener('change', notify)
  }
}

function createGetSnapshot(query: string) {
  return () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  }
}

export function useMatchMedia(query: string): boolean {
  const subscribe = useMemo(() => createSubscribe(query), [query])
  const getSnapshot = useMemo(() => createGetSnapshot(query), [query])
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
