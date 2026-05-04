/**
 * Catalog / filters: course counts as «premium-related» when any task is `isPremium`,
 * or the whole course is tier-gated (`tierRequired > 0`).
 */
export function inferCatalogPremiumTasksBadge(
  tierRequired: number,
  hasAnyTaskMarkedPremium: boolean
): boolean {
  return hasAnyTaskMarkedPremium || tierRequired > 0
}

/**
 * Pink «Премиум-задачи» chip — mixed premium lessons on an otherwise free course.
 * When `tierRequired > 0`, show only «Премиум · Тир N»; that already covers access.
 */
export function shouldShowPremiumTasksChip(course: {
  tierRequired: number
  hasPremiumTasks?: boolean
}): boolean {
  return course.hasPremiumTasks === true && course.tierRequired <= 0
}
