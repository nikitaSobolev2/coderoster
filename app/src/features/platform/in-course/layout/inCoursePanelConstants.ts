/**
 * Percentage constraints for `react-resizable-panels` in in-course desktop layout.
 * Library uses 0–100% of the parent group axis.
 */
/**
 * Saved layout (`localStorage`). Single row: nav | task (theory) | workspace (editor + execution).
 * One `PanelGroup` so each panel’s `data-panel-size` is % of the full row (sums to 100).
 */
export const IN_COURSE_HORIZONTAL_AUTOSAVE_ID = 'coderoster.inCourse.horizontal.v4'

export const IN_COURSE_VERTICAL_AUTOSAVE_ID = 'coderoster.inCourse.vertical.v9'

/** Lesson nav: switch to icon rail when column inner width ≤ this (ResizeObserver). */
export const NAV_PANEL_RAIL_MAX_INNER_WIDTH_PX = 140

/**
 * Collapsible rail. {@link collapsedSize} when folded.
 * `react-resizable-panels` {@link validatePanelGroupLayout} clamps to each panel's {@link maxSize}
 * then redistributes leftover % — if workspace {@link maxSize} is too low, a [3,3,~94] rail row
 * becomes clamped and the remainder inflates a column to ~9. Set {@link minSize} =
 * {@link collapsedSize} so expanded vs collapsed snap is unambiguous.
 */
export const COLLAPSIBLE_RAIL = {
  collapsedSize: 3,
  snapCollapseBelow: 4,
  minSize: 3
} as const

/**
 * Horizontal row: all `defaultSize` / `data-panel-size` values are % of the same outer row.
 * Targets: lesson nav 12, theory/task column 46, practice (editor stack) 42.
 */
export const NAV_PANEL = {
  ...COLLAPSIBLE_RAIL,
  defaultSize: 12,
  maxSize: 52
} as const

export const TASK_PANEL = {
  ...COLLAPSIBLE_RAIL,
  defaultSize: 46,
  maxSize: 97
} as const

export const WORKSPACE_PANEL = {
  ...COLLAPSIBLE_RAIL,
  defaultSize: 42,
  maxSize: 97
} as const

/** Vertical: Monaco. {@link maxSize} must leave room for execution {@link EXECUTION_PANEL.collapsedSize}. */
export const EDITOR_PANEL = {
  ...COLLAPSIBLE_RAIL,
  defaultSize: 62,
  maxSize: 97
} as const

export const EXECUTION_PANEL = {
  ...COLLAPSIBLE_RAIL,
  defaultSize: 38,
  maxSize: 97
} as const

/**
 * `react-resizable-panels` layouts are 0–100 and sum ~100. Stored `autoSaveId` payloads (or edge reads)
 * can deserialize as **0–1 fractions** summing ~1. Without scaling, `0.26 < snapCollapseBelow` wrongly
 * enables rail chrome for a ~26% column.
 */
export function normalizeResizablePanelLayoutToPercent(layout: number[]): number[] {
  if (layout.length === 0) return layout
  const total = layout.reduce((acc, s) => acc + s, 0)
  if (total <= 0) return layout
  if (Math.abs(total - 1) < 0.02) {
    return layout.map(s => s * 100)
  }
  return layout
}

/** True when panel is at collapsed rail % (matches library `isCollapsed`). */
export function isCollapsibleRailLayoutPct(
  sizePct: number,
  collapsedSize: number = COLLAPSIBLE_RAIL.collapsedSize
): boolean {
  return sizePct > 0 && sizePct <= collapsedSize + 2
}

/**
 * Minimal rail chrome only while layout % is in the snap band (strictly below `snapCollapseBelow`, default 4).
 * Does not call {@link ImperativePanelHandle.isCollapsed}: stale `true` used to force rail near ~26% while layout was wide.
 */
export function shouldUseCollapsibleRailChrome(
  sizePct: number,
  snapCollapseBelow: number = COLLAPSIBLE_RAIL.snapCollapseBelow
): boolean {
  if (sizePct <= 0) return false
  return sizePct < snapCollapseBelow
}

/** Fire `panel.collapse()` when drag lands between collapsed rail % and snap threshold. */
export function shouldSnapPanelToCollapsedRail(
  sizePct: number,
  snapCollapseBelow: number = COLLAPSIBLE_RAIL.snapCollapseBelow,
  collapsedSize: number = COLLAPSIBLE_RAIL.collapsedSize
): boolean {
  return sizePct > collapsedSize && sizePct < snapCollapseBelow
}

/**
 * Stacked editor / execution: show label strip + hide body while height is below snap threshold
 * (same band where drag snaps to collapsed rail).
 */
export function isVerticalSplitRailUiPct(
  sizePct: number,
  snapCollapseBelow: number = COLLAPSIBLE_RAIL.snapCollapseBelow
): boolean {
  return sizePct > 0 && sizePct < snapCollapseBelow
}
