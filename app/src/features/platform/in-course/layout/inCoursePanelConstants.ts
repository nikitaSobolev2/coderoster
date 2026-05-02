/**
 * Percentage constraints for `react-resizable-panels` in in-course desktop layout.
 * Library uses 0–100% of the parent group axis.
 */
export const IN_COURSE_HORIZONTAL_AUTOSAVE_ID = 'coderoster.inCourse.horizontal'

export const IN_COURSE_VERTICAL_AUTOSAVE_ID = 'coderoster.inCourse.vertical'

/** First column: lesson nav. Snaps to collapsed (icons-only) via `collapsible` + layout handler. */
export const NAV_PANEL = {
  /** % of horizontal group when collapsed to icon rail (narrower → smaller %). */
  collapsedSize: 3,
  defaultSize: 17,
  /** Below this % while expanded → auto-collapse */
  snapCollapseBelow: 10,
  minSize: 12,
  maxSize: 30
} as const

export const TASK_PANEL = {
  defaultSize: 34,
  minSize: 18,
  maxSize: 52
} as const

export const WORKSPACE_PANEL = {
  defaultSize: 49,
  minSize: 26,
  maxSize: 62
} as const

/** Vertical split: Monaco vs execution tabs. */
export const EDITOR_PANEL = {
  defaultSize: 62,
  minSize: 26,
  maxSize: 78
} as const

export const EXECUTION_PANEL = {
  defaultSize: 38,
  minSize: 18,
  maxSize: 60
} as const
