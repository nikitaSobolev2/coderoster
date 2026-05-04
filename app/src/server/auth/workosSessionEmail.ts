/**
 * WorkOS `User` typing allows odd runtime shapes at boundaries; never pass raw
 * `session.user.email` into DB sync without this guard.
 */
export function normalizeWorkosSessionEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null
  const trimmed = email.trim()
  return trimmed.length > 0 ? trimmed : null
}
