/**
 * Catalog / course header «Премиум-задачи» chip: show when any task is flagged
 * `isPremium`, or the whole course requires a paid tier (`tierRequired > 0`).
 */
export function inferCatalogPremiumTasksBadge(
  tierRequired: number,
  hasAnyTaskMarkedPremium: boolean
): boolean {
  return hasAnyTaskMarkedPremium || tierRequired > 0
}
