'use client'

import { createContext, useContext } from 'react'

import type { BackofficeRole } from '~/shared/types/backoffice'

const BackofficeRoleContext = createContext<BackofficeRole | null>(null)

export function BackofficeRoleProvider({
  role,
  children
}: {
  role: BackofficeRole
  children: React.ReactNode
}) {
  return <BackofficeRoleContext.Provider value={role}>{children}</BackofficeRoleContext.Provider>
}

export function useBackofficeRole(): BackofficeRole {
  const value = useContext(BackofficeRoleContext)
  if (!value) {
    throw new Error('useBackofficeRole must be used inside BackofficeRoleProvider')
  }
  return value
}
