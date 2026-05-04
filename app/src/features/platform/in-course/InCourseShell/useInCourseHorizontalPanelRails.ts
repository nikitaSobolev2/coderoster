'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { type ImperativePanelGroupHandle, type ImperativePanelHandle } from 'react-resizable-panels'
import {
  NAV_PANEL,
  normalizeResizablePanelLayoutToPercent,
  shouldSnapPanelToCollapsedRail,
  shouldUseCollapsibleRailChrome,
  TASK_PANEL,
  WORKSPACE_PANEL
} from '../layout/inCoursePanelConstants'

/** Horizontal `react-resizable-panels` snap rail flags + refs for `/learn/[course]/[lesson]`. */
export function useInCourseHorizontalPanelRails(desktopPanels: boolean, lessonId: string) {
  const [navRailCollapsed, setNavRailCollapsed] = useState(false)
  const [taskRailCollapsed, setTaskRailCollapsed] = useState(false)
  const [workspaceRailCollapsed, setWorkspaceRailCollapsed] = useState(false)
  const horizontalPanelGroupRef = useRef<ImperativePanelGroupHandle>(null)
  const navPanelRef = useRef<ImperativePanelHandle>(null)
  const taskPanelRef = useRef<ImperativePanelHandle>(null)
  const workspacePanelRef = useRef<ImperativePanelHandle>(null)

  const handleHorizontalLayout = useCallback((sizes: number[]) => {
    const navApi = navPanelRef.current
    const taskApi = taskPanelRef.current
    const workspaceApi = workspacePanelRef.current
    const n = normalizeResizablePanelLayoutToPercent(sizes)
    const navPct = n[0] ?? 0
    const taskPct = n[1] ?? 0
    const workspacePct = n[2] ?? 0

    if (navApi) {
      setNavRailCollapsed(shouldUseCollapsibleRailChrome(navPct, NAV_PANEL.snapCollapseBelow))
      if (
        shouldSnapPanelToCollapsedRail(navPct, NAV_PANEL.snapCollapseBelow, NAV_PANEL.collapsedSize)
      ) {
        queueMicrotask(() => navApi.collapse())
      }
    }

    if (taskApi) {
      setTaskRailCollapsed(shouldUseCollapsibleRailChrome(taskPct, TASK_PANEL.snapCollapseBelow))
      if (
        shouldSnapPanelToCollapsedRail(
          taskPct,
          TASK_PANEL.snapCollapseBelow,
          TASK_PANEL.collapsedSize
        )
      ) {
        queueMicrotask(() => taskApi.collapse())
      }
    }

    if (workspaceApi) {
      setWorkspaceRailCollapsed(
        shouldUseCollapsibleRailChrome(workspacePct, WORKSPACE_PANEL.snapCollapseBelow)
      )
      if (
        shouldSnapPanelToCollapsedRail(
          workspacePct,
          WORKSPACE_PANEL.snapCollapseBelow,
          WORKSPACE_PANEL.collapsedSize
        )
      ) {
        queueMicrotask(() => workspaceApi.collapse())
      }
    }
  }, [])

  useLayoutEffect(() => {
    if (!desktopPanels) return
    queueMicrotask(() => {
      const raw = horizontalPanelGroupRef.current?.getLayout()
      if (!raw || raw.length < 3) return
      const n = normalizeResizablePanelLayoutToPercent(raw)
      const navPct = n[0] ?? 0
      const taskPct = n[1] ?? 0
      const workspacePct = n[2] ?? 0
      setNavRailCollapsed(shouldUseCollapsibleRailChrome(navPct, NAV_PANEL.snapCollapseBelow))
      setTaskRailCollapsed(shouldUseCollapsibleRailChrome(taskPct, TASK_PANEL.snapCollapseBelow))
      setWorkspaceRailCollapsed(
        shouldUseCollapsibleRailChrome(workspacePct, WORKSPACE_PANEL.snapCollapseBelow)
      )
    })
  }, [desktopPanels, lessonId])

  return {
    horizontalPanelGroupRef,
    navPanelRef,
    taskPanelRef,
    workspacePanelRef,
    handleHorizontalLayout,
    navRailCollapsed,
    taskRailCollapsed,
    workspaceRailCollapsed
  }
}
