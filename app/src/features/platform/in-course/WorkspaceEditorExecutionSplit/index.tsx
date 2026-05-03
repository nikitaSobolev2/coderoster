'use client'

import clsx from 'clsx'
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Panel,
  PanelGroup,
  type ImperativePanelGroupHandle,
  type ImperativePanelHandle
} from 'react-resizable-panels'
import InCoursePanelResizeHandle from '../layout/InCoursePanelResizeHandle'
import {
  EDITOR_PANEL,
  EXECUTION_PANEL,
  IN_COURSE_VERTICAL_AUTOSAVE_ID,
  isVerticalSplitRailUiPct,
  normalizeResizablePanelLayoutToPercent,
  shouldSnapPanelToCollapsedRail
} from '../layout/inCoursePanelConstants'
import { WorkspaceVerticalLayoutContext } from '../layout/WorkspaceVerticalLayoutContext'
import styles from '../InCourseShell/styles.module.scss'
import splitPorts from './splitPorts.module.scss'

export interface WorkspaceEditorExecutionSplitProps {
  /** When false, use legacy fixed grid rows (narrow / SSR fallbacks). */
  desktopPanels: boolean
  editorSlot: ReactNode
  executionSlot: ReactNode
}

export default function WorkspaceEditorExecutionSplit({
  desktopPanels,
  editorSlot,
  executionSlot
}: WorkspaceEditorExecutionSplitProps) {
  const verticalGroupRef = useRef<ImperativePanelGroupHandle>(null)
  const editorPanelRef = useRef<ImperativePanelHandle>(null)
  const executionPanelRef = useRef<ImperativePanelHandle>(null)
  const [editorRailOnly, setEditorRailOnly] = useState(false)
  const [executionRailOnly, setExecutionRailOnly] = useState(false)

  const syncRailFlagsFromLayout = useCallback(() => {
    const raw = verticalGroupRef.current?.getLayout()
    if (!raw || raw.length < 2) return
    const n = normalizeResizablePanelLayoutToPercent(raw)
    const editorPct = n[0] ?? 0
    const execPct = n[1] ?? 0
    setEditorRailOnly(isVerticalSplitRailUiPct(editorPct, EDITOR_PANEL.snapCollapseBelow))
    setExecutionRailOnly(isVerticalSplitRailUiPct(execPct, EXECUTION_PANEL.snapCollapseBelow))
  }, [])

  const handleVerticalLayout = useCallback(
    (sizes: number[]) => {
      const editorApi = editorPanelRef.current
      const execApi = executionPanelRef.current
      const n = normalizeResizablePanelLayoutToPercent(sizes)
      const editorPct = n[0] ?? 0
      const execPct = n[1] ?? 0

      if (
        shouldSnapPanelToCollapsedRail(
          editorPct,
          EDITOR_PANEL.snapCollapseBelow,
          EDITOR_PANEL.collapsedSize
        )
      ) {
        queueMicrotask(() => editorApi?.collapse())
      }
      if (
        shouldSnapPanelToCollapsedRail(
          execPct,
          EXECUTION_PANEL.snapCollapseBelow,
          EXECUTION_PANEL.collapsedSize
        )
      ) {
        queueMicrotask(() => execApi?.collapse())
      }
      queueMicrotask(syncRailFlagsFromLayout)
    },
    [syncRailFlagsFromLayout]
  )

  useLayoutEffect(() => {
    if (!desktopPanels) return
    queueMicrotask(syncRailFlagsFromLayout)
  }, [desktopPanels, syncRailFlagsFromLayout, editorSlot, executionSlot])

  const onEditorResize = useCallback(() => {
    syncRailFlagsFromLayout()
  }, [syncRailFlagsFromLayout])

  const onExecutionResize = useCallback(() => {
    syncRailFlagsFromLayout()
  }, [syncRailFlagsFromLayout])

  const layoutCtx = useMemo(
    () => ({ editorRailOnly, executionRailOnly }),
    [editorRailOnly, executionRailOnly]
  )

  if (!desktopPanels) {
    return (
      <>
        <div className={styles.workspace__editor}>{editorSlot}</div>
        <div className={styles.workspace__execution}>{executionSlot}</div>
      </>
    )
  }

  return (
    <WorkspaceVerticalLayoutContext.Provider value={layoutCtx}>
      <PanelGroup
        ref={verticalGroupRef}
        direction="vertical"
        autoSaveId={IN_COURSE_VERTICAL_AUTOSAVE_ID}
        className={styles.workspaceVerticalGroup}
        onLayout={handleVerticalLayout}
      >
        <Panel
          ref={editorPanelRef}
          id="in-course-editor"
          order={1}
          collapsible
          collapsedSize={EDITOR_PANEL.collapsedSize}
          defaultSize={EDITOR_PANEL.defaultSize}
          minSize={EDITOR_PANEL.minSize}
          maxSize={EDITOR_PANEL.maxSize}
          className={styles.panelCellColumn}
          onResize={onEditorResize}
          onExpand={() => queueMicrotask(syncRailFlagsFromLayout)}
        >
          <div
            className={clsx(
              splitPorts.editorPort,
              editorRailOnly && splitPorts.editorPort_labelOnly
            )}
          >
            <aside className={splitPorts.editorRibbon} aria-label="Редактор">
              <span className={splitPorts.editorRibbonLabel}>Редактор</span>
            </aside>
            <div className={splitPorts.editorMain} aria-hidden={editorRailOnly}>
              <div className={clsx(styles.workspace__editor, splitPorts.editorStretch)}>
                {editorSlot}
              </div>
            </div>
          </div>
        </Panel>
        <InCoursePanelResizeHandle
          orientation="horizontal"
          resizeHandleId="in-course-editor-exec-split"
        />
        <Panel
          ref={executionPanelRef}
          id="in-course-execution"
          order={2}
          collapsible
          collapsedSize={EXECUTION_PANEL.collapsedSize}
          defaultSize={EXECUTION_PANEL.defaultSize}
          minSize={EXECUTION_PANEL.minSize}
          maxSize={EXECUTION_PANEL.maxSize}
          className={styles.panelCellColumn}
          onResize={onExecutionResize}
          onExpand={() => queueMicrotask(syncRailFlagsFromLayout)}
        >
          <div className={styles.workspace__execution}>{executionSlot}</div>
        </Panel>
      </PanelGroup>
    </WorkspaceVerticalLayoutContext.Provider>
  )
}
