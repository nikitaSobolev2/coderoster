'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export interface LiveChatPlatformContextValue {
  open: boolean
  setOpen: (next: boolean) => void
  toggle: () => void
}

const LiveChatPlatformContext = createContext<LiveChatPlatformContextValue | null>(null)

export function LiveChatPlatformProvider({ children }: { readonly children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen(current => !current), [])
  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle
    }),
    [open, toggle]
  )
  return (
    <LiveChatPlatformContext.Provider value={value}>{children}</LiveChatPlatformContext.Provider>
  )
}

export function useLiveChatPlatform(): LiveChatPlatformContextValue | null {
  return useContext(LiveChatPlatformContext)
}
