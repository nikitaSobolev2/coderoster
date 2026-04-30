/** Minimum plan tier for the whole course (`Course.tierRequired`). */
export function formatPremiumCourseAccessLabel(tierRequired: number): string {
  if (tierRequired <= 0) return ''
  return `Премиум · Тир ${tierRequired}`
}

/** Effective tier for a lesson / task (`requiredTierForTask`). */
export function formatPremiumLessonAccessLabel(effectiveTier: number): string {
  if (effectiveTier <= 0) return ''
  return `Премиум · Тир ${effectiveTier}`
}
