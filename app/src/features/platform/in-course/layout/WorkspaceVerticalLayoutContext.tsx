'use client'

import { createContext, useContext } from 'react'

export interface WorkspaceVerticalLayoutValue {
  /** Vertical panel height is rail-only (~collapsedSize %) — hide Monaco. */
  editorRailOnly: boolean
  /** Vertical panel height is rail-only — hide tabs / body. */
  executionRailOnly: boolean
}

const defaultValue: WorkspaceVerticalLayoutValue = {
  editorRailOnly: false,
  executionRailOnly: false
}

export const WorkspaceVerticalLayoutContext = createContext(defaultValue)

export function useWorkspaceVerticalLayout(): WorkspaceVerticalLayoutValue {
  return useContext(WorkspaceVerticalLayoutContext)
}
