'use client'

import type { ReactNode, RefObject } from 'react'
import clsx from 'clsx'
import { Panel, PanelGroup } from 'react-resizable-panels'
import type { ImperativePanelGroupHandle, ImperativePanelHandle } from 'react-resizable-panels'
import type { CourseDetail, LessonDetail } from '~/server/repositories/types'
import TaskNav from '../TaskNav'
import InCoursePanelResizeHandle from '../layout/InCoursePanelResizeHandle'
import {
  IN_COURSE_HORIZONTAL_AUTOSAVE_ID,
  NAV_PANEL,
  TASK_PANEL,
  WORKSPACE_PANEL
} from '../layout/inCoursePanelConstants'
import styles from './styles.module.scss'

export interface InCourseShellPanelsProps {
  desktopPanels: boolean
  horizontalPanelGroupRef: RefObject<ImperativePanelGroupHandle | null>
  navPanelRef: RefObject<ImperativePanelHandle | null>
  taskPanelRef: RefObject<ImperativePanelHandle | null>
  workspacePanelRef: RefObject<ImperativePanelHandle | null>
  handleHorizontalLayout: (sizes: number[]) => void
  navRailCollapsed: boolean
  workspaceRailCollapsedChrome: boolean
  course: CourseDetail
  lesson: LessonDetail
  completedLessonIds: string[]
  viewerTier: number
  taskPaneEl: ReactNode
  workspaceSectionEl: ReactNode
}

export function InCourseShellPanels({
  desktopPanels,
  horizontalPanelGroupRef,
  navPanelRef,
  taskPanelRef,
  workspacePanelRef,
  handleHorizontalLayout,
  navRailCollapsed,
  workspaceRailCollapsedChrome,
  course,
  lesson,
  completedLessonIds,
  viewerTier,
  taskPaneEl,
  workspaceSectionEl
}: Readonly<InCourseShellPanelsProps>) {
  return (
    <div
      className={clsx(styles.shell, desktopPanels ? styles.shell_panelRoot : styles.shell_gridRoot)}
    >
      {desktopPanels ? (
        <PanelGroup
          ref={horizontalPanelGroupRef}
          direction="horizontal"
          autoSaveId={IN_COURSE_HORIZONTAL_AUTOSAVE_ID}
          className={styles.panelGroupHorizontal}
          onLayout={handleHorizontalLayout}
        >
          <Panel
            ref={navPanelRef}
            id="in-course-nav"
            order={1}
            collapsible
            collapsedSize={NAV_PANEL.collapsedSize}
            minSize={NAV_PANEL.minSize}
            maxSize={NAV_PANEL.maxSize}
            defaultSize={NAV_PANEL.defaultSize}
            className={styles.panelCell}
          >
            <TaskNav
              course={course}
              currentLessonId={lesson.id}
              completedLessonIds={completedLessonIds}
              viewerEffectiveTier={viewerTier}
              minimal={navRailCollapsed}
            />
          </Panel>
          <InCoursePanelResizeHandle
            orientation="vertical"
            resizeHandleId="in-course-split-nav-main"
          />
          <Panel
            ref={taskPanelRef}
            id="in-course-task"
            order={2}
            collapsible
            collapsedSize={TASK_PANEL.collapsedSize}
            defaultSize={TASK_PANEL.defaultSize}
            minSize={TASK_PANEL.minSize}
            maxSize={TASK_PANEL.maxSize}
            className={styles.panelCell}
          >
            {taskPaneEl}
          </Panel>
          <InCoursePanelResizeHandle
            orientation="vertical"
            resizeHandleId="in-course-split-task-workspace"
          />
          <Panel
            ref={workspacePanelRef}
            id="in-course-workspace"
            order={3}
            collapsible
            collapsedSize={WORKSPACE_PANEL.collapsedSize}
            defaultSize={WORKSPACE_PANEL.defaultSize}
            minSize={WORKSPACE_PANEL.minSize}
            maxSize={WORKSPACE_PANEL.maxSize}
            className={styles.panelCell}
          >
            <div className={styles.workspacePanelRoot}>
              {workspaceRailCollapsedChrome ? (
                <aside className={styles.workspaceColumnRail} aria-label="Рабочая область">
                  <span className={styles.workspaceColumnRailLabel}>Практика</span>
                </aside>
              ) : null}
              <div
                className={clsx(
                  styles.workspaceHost,
                  workspaceRailCollapsedChrome && styles.workspaceHost_collapsedHidden
                )}
              >
                {workspaceSectionEl}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      ) : (
        <>
          <aside className={styles.shell__nav}>
            <TaskNav
              course={course}
              currentLessonId={lesson.id}
              completedLessonIds={completedLessonIds}
              viewerEffectiveTier={viewerTier}
            />
          </aside>
          {taskPaneEl}
          {workspaceSectionEl}
        </>
      )}
    </div>
  )
}
