'use client'

import { createContext, useContext, type ReactNode } from 'react'

interface LiveChatHomeContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const LiveChatHomeContext = createContext<LiveChatHomeContextValue | null>(null)

export function LiveChatHomeProvider({
  children,
  value
}: {
  children: ReactNode
  value: LiveChatHomeContextValue
}) {
  return <LiveChatHomeContext.Provider value={value}>{children}</LiveChatHomeContext.Provider>
}

export function useLiveChatHome(): LiveChatHomeContextValue | null {
  return useContext(LiveChatHomeContext)
}
