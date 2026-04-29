/** Product name shown in UI, metadata, and legal copy. Single source of truth for renames. */
export const SITE_NAME = 'Кодиум' as const

export function pageTitle(pageLabel: string): string {
  return `${pageLabel} — ${SITE_NAME}`
}
