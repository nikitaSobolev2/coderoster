/**
 * Calendar date as DD.MM.YYYY in UTC. Same output in Node SSR and browser
 * (unlike `toLocaleDateString()` without `timeZone`, which caused hydration
 * mismatches for stored ISO timestamps).
 */
export function formatStableDateDdMmYyyy(iso: string | Date | null | undefined): string {
  if (iso == null) return '—'
  const d = typeof iso === 'string' || typeof iso === 'number' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = d.getUTCFullYear()
  return `${dd}.${mm}.${yyyy}`
}
