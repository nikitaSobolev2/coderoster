'use client'

import type { ReactNode } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import InCoursePanelResizeHandle from '../layout/InCoursePanelResizeHandle'
import {
  EDITOR_PANEL,
  EXECUTION_PANEL,
  IN_COURSE_VERTICAL_AUTOSAVE_ID
} from '../layout/inCoursePanelConstants'
import styles from '../InCourseShell/styles.module.scss'

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
  if (!desktopPanels) {
    return (
      <>
        <div className={styles.workspace__editor}>{editorSlot}</div>
        <div className={styles.workspace__execution}>{executionSlot}</div>
      </>
    )
  }

  return (
    <PanelGroup
      direction="vertical"
      autoSaveId={IN_COURSE_VERTICAL_AUTOSAVE_ID}
      className={styles.workspaceVerticalGroup}
    >
      <Panel
        id="in-course-editor"
        defaultSize={EDITOR_PANEL.defaultSize}
        minSize={EDITOR_PANEL.minSize}
        maxSize={EDITOR_PANEL.maxSize}
        className={styles.panelCellColumn}
      >
        <div className={styles.workspace__editor}>{editorSlot}</div>
      </Panel>
      <InCoursePanelResizeHandle
        orientation="horizontal"
        resizeHandleId="in-course-editor-exec-split"
      />
      <Panel
        id="in-course-execution"
        defaultSize={EXECUTION_PANEL.defaultSize}
        minSize={EXECUTION_PANEL.minSize}
        maxSize={EXECUTION_PANEL.maxSize}
        className={styles.panelCellColumn}
      >
        <div className={styles.workspace__execution}>{executionSlot}</div>
      </Panel>
    </PanelGroup>
  )
}
