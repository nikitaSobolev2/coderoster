/**
 * Effective plan tier required for a lesson/task (client + server).
 * Premium tasks use max(course floor, task.minPlanTier).
 */
export function requiredTierForTask(
  courseTierRequired: number,
  task: { isPremium: boolean; minPlanTier: number }
): number {
  if (task.isPremium) return Math.max(courseTierRequired, task.minPlanTier)
  return courseTierRequired
}
